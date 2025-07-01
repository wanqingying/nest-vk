import calculateSlot from 'cluster-key-slot';
import { RedisClusterType, RedisClientType } from 'redis';

import { HashTagProvider } from './hash-tag-provider';

type NodeBasedIntervalHashTagProviderOptions = {
  slotsRefreshInterval?: number;
};

export class NodeBasedIntervalHashTagProvider extends HashTagProvider {
  private hashtags = new Map<string, string>(); // masterId -> hashtag
  private masterWithTags = new Map<string, RedisClientType>(); // hashtag -> master client
  private slotsCache: string[] = [];
  private cluster: RedisClusterType;
  private slotsRefreshInterval: number;
  private refreshTimer: NodeJS.Timeout;

  public constructor(options: NodeBasedIntervalHashTagProviderOptions = {}) {
    super();
    this.slotsRefreshInterval = options.slotsRefreshInterval ?? 5000;
  }

  public async init(cluster: RedisClusterType): Promise<void> {
    this.cluster = cluster;
    await this.discoverHashTags();
    this.subscribeClusterSlots();
  }

  public getHashTag(key: string): string {
    const slot = calculateSlot(key);
    const master = this.cluster.slots[slot].master;
    return this.hashtags.get(master.id);
  }

  public async getClientByHashTag(hashTag: string): Promise<RedisClientType> {
    return this.masterWithTags.get(hashTag)!;
  }

  private async discoverHashTags(): Promise<void> {
    const cluster = this.cluster;

    const uniqueMasterIds = new Set(cluster.masters.map(master => master.id));
    const expectedMasters = uniqueMasterIds.size;

    let i = 1;
    const maxAttempts = 109758;
    let attempts = 0;

    while (this.hashtags.size < expectedMasters && attempts < maxAttempts) {
      attempts++;
      const slot = calculateSlot(String(++i));
      const master = cluster.slots[slot].master;
      if (!this.hashtags.has(master.id)) {
        this.hashtags.set(master.id, String(i));
        let client: RedisClientType = master.client as RedisClientType;
        if (master.client instanceof Promise) {
          client = await master.client;
        }
        this.masterWithTags.set(String(i), client);
      }
    }

    if (this.hashtags.size < expectedMasters) {
      console.error('RedisClusterService Failed to discover all hash tags.', {
        hashtagSize: this.hashtags.size,
        expectedMasters,
        attempts,
      });
    }
  }

  private subscribeClusterSlots(): void {
    this.refreshTimer = setInterval(async () => {
      try {
        const slots = this.cluster.slots;
        const isInit = this.slotsCache.length === 0;
        let isChanged = false;
        for (let i = 0; i < slots.length; i++) {
          if (slots[i].master.id !== this.slotsCache[i]) isChanged = true;
          this.slotsCache[i] = slots[i].master.id;
        }
        if (isChanged && !isInit) {
          this.hashtags.clear();
          this.masterWithTags.clear();
          await this.discoverHashTags();
        }
      } catch (e) {
        console.warn('RefreshSlotsError probably due to server closed', e);
      }
    }, this.slotsRefreshInterval);
  }
  public cleanUp(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
}
