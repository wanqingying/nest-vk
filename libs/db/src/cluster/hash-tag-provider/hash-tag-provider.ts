import { RedisClientType, RedisClusterType } from 'redis';

export type RedisCommandFunc = () => Promise<void>;

export abstract class HashTagProvider {
  public async init(cluster: RedisClusterType): Promise<void> {
    // do nothing by default
  }

  public abstract getHashTag(key: string): string;
  public abstract getClientByHashTag(hashTag: string): Promise<RedisClientType>;
  public cleanUp(): void {
    // clean up resources if needed
  }

  public buildKeyBuckets(keys: string[]): Record<string, string[]> {
    const buckets: Record<string, string[]> = {};
    for (const key of keys) {
      const hashTag = this.getHashTag(key);
      if (buckets[hashTag] === undefined) {
        buckets[hashTag] = [];
      }
      buckets[hashTag].push(key);
    }
    return buckets;
  }

  public buildBuckets<T>(values: Record<string, T>): Record<string, Record<string, T>> {
    const buckets: Record<string, Record<string, T>> = {};
    for (const [key, value] of Object.entries(values)) {
      const hashTag = this.getHashTag(key);
      if (buckets[hashTag] === undefined) {
        buckets[hashTag] = {};
      }
      buckets[hashTag][key] = value;
    }
    return buckets;
  }

  public async sendCommand(command: RedisCommandFunc): Promise<void> {
    await command();
  }
}
