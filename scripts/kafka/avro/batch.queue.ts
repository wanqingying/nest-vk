export interface BatchConfig<T = any> {
  // flush when reach max size
  size: number;
  // flush after xx ms
  interval: number;
  resolve: (data: T[]) => Promise<void>;
}

export class AsyncBatchQueue<T = any> {
  private queue: T[] = [];
  private config: BatchConfig;
  private timer?: NodeJS.Timeout;
  private handle: (data: T[]) => Promise<void>;
  public pending?: Promise<void>;
  public static FlushEvent = 'flush';
  public constructor(config: BatchConfig) {
    this.config = config;
    this.resetInterval();
    this.handle = config.resolve;
  }

  public get length(): number {
    return this.queue.length;
  }

  public async add(data: T): Promise<void> {
    if (this.pending) {
      // wait here, limit write data 1 concurrent
      await this.pending;
    }
    this.queue.push(data);
    if (this.queue.length >= this.config.size) {
      this.flush();
      this.resetInterval();
    }
  }
  public async addList(data: T[]): Promise<void> {
    for (const item of data) {
      await this.add(item);
    }
  }

  private resetInterval() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.flush();
    }, this.config.interval);
  }

  public async flush(): Promise<void> {
    this.pending = new Promise<void>(async (resolve) => {
      const list = Array.from(this.queue);
      this.queue = [];
      try {
        await this.handle(list);
      } catch (e) {
        console.error(e);
      } finally {
        this.pending = undefined;
        resolve();
      }
    });
    return this.pending;
  }
  public stop(): void {
    clearInterval(this.timer);
  }
}
