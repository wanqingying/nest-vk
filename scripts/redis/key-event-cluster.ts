import {
  createCluster,
  createClient,
  RedisClientType,
  RedisClusterType,
} from 'redis';
import { scheduler } from 'node:timers/promises';
import { EventEmitter } from 'node:events';

export class RedisClusterEvent extends EventEmitter {
  private cluster: RedisClusterType;

  public constructor(_cluster: RedisClusterType) {
    super();
    this.cluster = _cluster;
  }
  public async init() {}
}
