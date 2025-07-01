import { RedisClientType, RedisClusterType } from 'redis';

import { HashTagProvider } from './hash-tag-provider';
import { crc16 } from '../hash/crc16.hash';

export interface FixedTagsHashTagProviderOptions {
  hashFunc: (key: string) => number;
  hashTagCount: number;
}

export class FixedTagsHashTagProvider extends HashTagProvider {
  private cluster: RedisClusterType | undefined;
  private hashToSlot: Map<string, number> = new Map();

  public constructor(private readonly options: FixedTagsHashTagProviderOptions) {
    super();
  }

  public async init(cluster: RedisClusterType): Promise<void> {
    this.cluster = cluster;
    for (let i = 0; i < this.options.hashTagCount; i++) {
      this.hashToSlot.set(i.toString(), crc16(i.toString()));
    }
  }

  public getHashTag(key: string): string {
    const hash = this.options.hashFunc(key);
    const slotHash = hash % this.options.hashTagCount;
    return `${slotHash}`;
  }

  public async getClientByHashTag(hashTag: string): Promise<RedisClientType> {
    return this.cluster.slots[this.hashToSlot.get(hashTag)].master.client;
  }
}
