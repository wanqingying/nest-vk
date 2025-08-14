import { AsyncBatchQueue, BatchConfig } from './batch.queue';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('AsyncBatchQueue', () => {
  let mockResolve: jest.Mock;
  let config: BatchConfig<number>;
  let queue: AsyncBatchQueue<number>;

  beforeEach(() => {
    mockResolve = jest.fn().mockResolvedValue(undefined);
    config = {
      size: 3,
      interval: 1000,
      resolve: mockResolve,
    };
    queue = new AsyncBatchQueue<number>(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
    queue.stop();
  });

  it('should flush when the queue reaches the max size', async () => {
    await queue.add(1);
    await queue.add(2);
    expect(mockResolve).not.toHaveBeenCalled();

    await queue.add(3); // This should trigger a flush
    expect(mockResolve).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('should flush after the interval', async () => {
    await queue.add(1);
    await queue.add(2);
    await wait(1000);
    expect(mockResolve).toHaveBeenCalledWith([1, 2]);
  });

  it('should handle addList correctly', async () => {
    await queue.addList([1, 2, 3, 4]);

    expect(mockResolve).toHaveBeenCalledWith([1, 2, 3]);
    await wait(1000);
    expect(mockResolve).toHaveBeenCalledWith([4]);
  });

  it('should reset the interval after a flush', async () => {
    await queue.add(1);
    await wait(500);
    await queue.add(2);
    await queue.add(3);
    await queue.add(4);

    expect(mockResolve).toHaveBeenCalledWith([1, 2, 3]);
    expect(mockResolve).toHaveBeenCalledTimes(1);

    await wait(600);
    expect(mockResolve).toHaveBeenCalledTimes(1);

    await wait(400);
    expect(mockResolve).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent add calls correctly', async () => {
    const promises = [queue.add(1), queue.add(2), queue.add(3)];
    await Promise.all(promises);

    expect(mockResolve).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('should not flush an empty queue', async () => {
    const promises = [queue.add(1), queue.add(2), queue.add(3), queue.add(4)];
    await Promise.all(promises);
    expect(mockResolve).toHaveBeenCalledWith([1, 2, 3]);
    expect(mockResolve).toHaveBeenCalledTimes(1);

    await queue.flush();
    expect(mockResolve).toHaveBeenCalledWith([4]);
    expect(mockResolve).toHaveBeenCalledTimes(2);
    await queue.flush();
    expect(mockResolve).toHaveBeenCalledWith([]);
  });

  it('case-1', async () => {
    mockResolve = jest.fn().mockImplementation(async () => {
      await wait(1000);
    });
    config = {
      size: 3,
      interval: 1500,
      resolve: mockResolve,
    };
    queue = new AsyncBatchQueue<number>(config);

    await Promise.all([queue.add(1), queue.add(2), queue.add(3)]);
    expect(mockResolve).toHaveBeenCalledTimes(1);
    expect(queue.length).toBe(0);
    const start = Date.now();
    await Promise.all([queue.add(4)]);
    // wait pending
    expect(Date.now() - start).toBeGreaterThanOrEqual(990);
    expect(queue.length).toBe(1);
    await Promise.all([queue.add(5), queue.add(6)]);
    expect(mockResolve).toHaveBeenCalledTimes(2);
  });
  it('case-2', async () => {
    mockResolve = jest.fn().mockImplementation(async () => {
      await wait(1500);
    });
    config = {
      size: 3,
      interval: 1000,
      resolve: mockResolve,
    };
    queue = new AsyncBatchQueue<number>(config);
    const start = Date.now();
    await Promise.all([queue.add(1), queue.add(2), queue.add(3), queue.add(4)]);
    expect(mockResolve).toHaveBeenCalledTimes(2);
    expect(Date.now() - start).toBeGreaterThanOrEqual(1490);
    expect(queue.length).toBe(1);
    await wait(510);
    expect(queue.length).toBe(0);
  });
});
