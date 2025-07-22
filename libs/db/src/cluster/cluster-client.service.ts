import {
  OnModuleInit,
  Injectable,
  OnModuleDestroy,
  OnApplicationShutdown,
} from '@nestjs/common';
import * as assert from 'node:assert';
import * as util from 'node:util';
import {
  createClient,
  createCluster,
  RedisClusterType,
  RedisClusterOptions,
} from 'redis';
import { NestLogger } from '@libs/utils/src';

import {
  HashTagProvider,
  NodeBasedIntervalHashTagProvider,
} from './hash-tag-provider';

export type HSetWithTTLsInput = {
  /**
   * Object containing key-value pairs to set in the hash.
   * Example: { "key1": { "field1": "value1", "field2": "value2" }, "key2": { "field1": "value3" } }
   */
  data: Record<string, Record<string, string>>;
  /**
   * Object containing TTLs for each key in milliseconds.
   * Example: { "key1": 1000, "key2": 2000 }
   */
  TTLsMs: Record<string, number>;
};

export interface ClusterNodeConfig {
  host: string;
  port: number;
}

export class ClusterConfig {
  public constructor(config: ClusterConfig) {
    Object.assign(this, config);
  }
  public name?: string = 'default' + Math.random().toString(36).substring(2);
  public nodes?: ClusterNodeConfig[];
  public host!: string;
  public port!: number;
  public clusterOptions?: Partial<RedisClusterOptions>;
  public global?: boolean = true;
  /** @deprecated use configured hashTagProvider */
  public slotsRefreshInterval?: number = 5000;
  public tls?: boolean = false;
  public hashTagProvider?: HashTagProvider;
}

@Injectable()
export class RedisClusterService
  implements OnModuleInit, OnApplicationShutdown
{
  private cluster!: RedisClusterType;
  private instanceId = Math.random().toString(36).substring(4);
  private readonly instanceName;
  private hashTagProvider!: HashTagProvider;

  public constructor(
    private readonly config: ClusterConfig,
    private logger: NestLogger,
  ) {
    this.instanceName = config.name;
  }

  public async onApplicationShutdown(): Promise<void> {
    // console.log('RedisClusterServiceDestroy');
    NestLogger.log('RedisClusterServiceDestroy');
    this.hashTagProvider.cleanUp();
    if (this.cluster) {
      // console.log('resit quit');
      NestLogger.log('cluster.quit start');
      // wait 100 ms
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await this.cluster.quit();
      NestLogger.log('cluster.quit done');
    }
  }

  public async heavyTest() {
    const count = 5000;
    const batchSize = 5000; // 每批次处理的键值对数量
    const prefix = 'test:heavy:';
    const dataToWrite: Record<string, string> = {};
    const allKeys: string[] = [];

    this.logger.log(`HeavyTest: 开始生成${count}个键值对`);
    const startGeneration = Date.now();

    // 生成80000个键值对
    for (let i = 0; i < count; i++) {
      const key = `${prefix}${i}`;
      dataToWrite[key] = `value-${i}`;
      allKeys.push(key);
    }

    const generationTime = Date.now() - startGeneration;
    this.logger.log(`HeavyTest: 生成数据完成，耗时${generationTime}ms`);

    // 批量写入数据
    this.logger.log(`HeavyTest: 开始批量写入${count}个键值对`);
    const startWrite = Date.now();

    // 分批写入数据
    for (let i = 0; i < count; i += batchSize) {
      const batchData: Record<string, string> = {};
      const end = Math.min(i + batchSize, count);

      for (let j = i; j < end; j++) {
        const key = `${prefix}${j}`;
        batchData[key] = dataToWrite[key];
      }

      await this.mSet(batchData);
    }

    const writeTime = Date.now() - startWrite;
    this.logger.log(
      `HeavyTest: 写入数据完成，耗时${writeTime}ms，写入速率: ${Math.floor(count / (writeTime / 1000))}条/秒`,
    );

    // 批量读取数据
    this.logger.log(`HeavyTest: 开始批量读取${count}个键值对`);
    const startRead = Date.now();

    let readCount = 0;
    let mismatchCount = 0;

    // 分批读取数据
    for (let i = 0; i < count; i += batchSize) {
      const batchKeys = allKeys.slice(i, i + batchSize);
      const results = await this.mGet(batchKeys);

      for (const key of batchKeys) {
        readCount++;
        if (results[key] !== dataToWrite[key]) {
          mismatchCount++;
        }
      }
    }

    const readTime = Date.now() - startRead;
    this.logger.log(
      `HeavyTest: 读取数据完成，耗时${readTime}ms，读取速率: ${Math.floor(count / (readTime / 1000))}条/秒`,
    );

    // 清理数据
    this.logger.log(`HeavyTest: 开始清理测试数据`);
    const startClean = Date.now();

    // 分批删除数据
    for (let i = 0; i < count; i += batchSize) {
      const batchKeys = allKeys.slice(i, i + batchSize);
      await this.del(batchKeys);
    }

    const cleanTime = Date.now() - startClean;
    this.logger.log(`HeavyTest: 清理数据完成，耗时${cleanTime}ms`);

    const totalTime = generationTime + writeTime + readTime + cleanTime;

    return {
      totalKeys: count,
      generationTime,
      writeTime,
      writeRate: Math.floor(count / (writeTime / 1000)),
      readTime,
      readRate: Math.floor(count / (readTime / 1000)),
      cleanTime,
      totalTime,
      mismatchCount,
      success: mismatchCount === 0,
    };
  }

  public async onModuleInit(): Promise<void> {
    let nodes: ClusterNodeConfig[] = [];
    this.logger.log('RedisClusterServiceInit', {
      correlationId: this.instanceId,
      instanceName: this.instanceName,
      host: this.config.host,
      port: this.config.port,
      nodes: JSON.stringify(this.config.nodes),
      clusterOptions: JSON.stringify(this.config.clusterOptions),
    });

    if (this.config.host && this.config.port) {
      nodes = await this.getClusterNodes();
    } else {
      nodes = this.config.nodes as ClusterNodeConfig[];
    }
    if (nodes.length < 1) {
      throw new Error('No master nodes found');
    }
    if (nodes.length < 3) {
      this.logger.warn('Cluster should have at least 3 master nodes', {
        instanceName: this.instanceName,
        clusterNodes: JSON.stringify(nodes),
        correlationId: this.instanceId,
      });
    }
    await this.initCluster(nodes);
    await this.health();
    this.hashTagProvider =
      this.config.hashTagProvider ??
      new NodeBasedIntervalHashTagProvider({
        slotsRefreshInterval: this.config.slotsRefreshInterval,
      });
    await this.hashTagProvider.init(this.cluster);
  }

  public async getClusterNodes(): Promise<ClusterNodeConfig[]> {
    const client = createClient({
      url: `redis://${this.config.host}:${this.config.port}`,
      socket: {
        tls: this.config.tls,
      },
    });
    client.on('error', (err) =>
      this.logger.error(
        'Redis Cluster Find Nodes Error' + err?.message,
        err?.stack,
      ),
    );
    await client.connect();
    const nodesInfo: string = await client.sendCommand(['CLUSTER', 'NODES']);
    await client.quit();
    if (!nodesInfo) return [];
    return nodesInfo
      .split('\n')
      .map((line: string) => {
        const [_, addr = ''] = line.split(' ');
        const [host, port] = addr.split(':');
        if (!host || !port) return null;
        return { host, port: parseInt(port) };
      })
      .filter(Boolean) as ClusterNodeConfig[];
  }

  public async initCluster(nodes: ClusterNodeConfig[]): Promise<void> {
    const defaultOptions: Partial<RedisClusterOptions> = {
      useReplicas: true,
      minimizeConnections: false,
      defaults: {
        socket: {
          tls: this.config.tls,
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            const jitter = Math.floor(Math.random() * 200);
            const delay = Math.min(Math.pow(2, retries) * 100, 9000);
            return delay + jitter;
          },
        },
      },
    };
    // TODO: consider to make deepMerge util function to merge options
    const options = {
      ...defaultOptions,
      ...this.config.clusterOptions,
      defaults: {
        ...defaultOptions.defaults,
        ...this.config.clusterOptions?.defaults,
        socket: {
          ...defaultOptions.defaults?.socket,
          ...this.config.clusterOptions?.defaults?.socket,
        },
      },
      rootNodes: nodes.map((n) => ({
        socket: {
          host: n.host,
          port: n.port,
        },
      })),
    };
    this.logger.log('InitRedisClusterStart', {
      correlationId: this.instanceId,
      instanceName: this.instanceName,
      options: JSON.stringify(options),
    });
    this.cluster = createCluster(options);
    this.cluster.addListener('error', (err) => {
      this.logger.warn('RedisClusterError', {
        correlationId: this.instanceId,
        instanceName: this.instanceName,
        error: util.inspect(err),
      });
    });
    await this.cluster.connect();
    this.logger.log('InitRedisClusterDone', {
      correlationId: this.instanceId,
      instanceName: this.instanceName,
      masterNodes: this.cluster.masters.map((m) => m.address),
      replicas: this.cluster.replicas.map((r) => r.address),
    });
  }

  public get client(): RedisClusterType {
    return this.cluster;
  }

  public async health(): Promise<string> {
    const client = this.client;
    await client.set('foo', 'foobar');
    const res = await client.get('foo');
    assert.strictEqual(res, 'foobar');
    return 'ok';
  }

  /**
   * Gets multiple keys from the cluster.
   * @param cmds Array of keys
   * @returns Promise resolving to a record of key-value pairs
   * @example
   * const values = await redisClusterService.mGet(['foo', 'bar']);
   */
  public async mGet(cmds: string[]): Promise<Record<string, string | null>> {
    const results = {};

    await this.forEachBucket(cmds, async (hashTag, keys) => {
      const hashKeys = keys.map((k) => createKey(hashTag, k));
      const res = await this.cluster.mGet(hashKeys);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        results[key] = res[i];
      }
    });

    return results;
  }

  /**
   * Gets all fields and values for multiple keys in the cluster.
   * @param keys
   * @returns Promise resolving to a record of key-value pairs
   */
  public async hGetAllForMany(
    keys: string[],
  ): Promise<Record<string, Record<string, string>>> {
    const hGetAllScript = `
      local result = {}
      for i=1, #KEYS do
          local key = KEYS[i]
          local hash = redis.call("HGETALL", key)
          table.insert(result, key)
          table.insert(result, hash)
      end
      return result
    `;

    const records = {};

    await this.forEachBucket(keys, async (hashTag, realKeys) => {
      const createdKeys = realKeys.map((realKey) =>
        createKey(hashTag, realKey),
      );
      const master = await this.hashTagProvider.getClientByHashTag(hashTag);
      const command: string[] = [
        'EVAL',
        hGetAllScript,
        createdKeys.length.toString(),
        ...createdKeys,
      ];

      /**
       * COMMAND PATTERN: EVAL script numberOfKeys [key1 ...]
       * EXAMPLE: EVAL script 2 key1 key2
       */
      const result = (await master.sendCommand(command)) as (
        | string
        | string[]
      )[];

      for (let i = 0; i < result.length; i += 2) {
        const originalKey = realKeys[i / 2];
        const hash = result[i + 1] as string[];
        if (hash.length === 0) {
          continue;
        }
        records[originalKey] = {};
        for (let j = 0; j < hash.length; j += 2) {
          records[originalKey][hash[j]] = hash[j + 1];
        }
      }
    });

    return records;
  }

  /**
   * Sets multiple key-value pairs in the cluster.
   * @param obj Object containing key-value pairs
   * @example
   * await redisClusterService.mSet({ foo: '1', bar: '2' });
   */
  public async mSet(obj: Record<string, string>): Promise<void> {
    await this.forEachBucket(obj, async (hashTag, keyVals) => {
      const cmds: string[] = [];
      for (const key in keyVals) {
        cmds.push(createKey(hashTag, key), keyVals[key]);
      }
      await this.cluster.mSet(cmds);
    });
  }

  /**
   * Sets multiple key-value pairs with a common TTL in milliseconds.
   * @param obj Object containing key-value pairs
   * @param ttl Time to live in milliseconds
   * @example
   * await redisClusterService.mSetPx({ foo: '1', bar: '2' }, 10000);
   */
  public async mSetPx(obj: Record<string, string>, ttl: number): Promise<void> {
    const mSetScript = `
      local ttl = tonumber(ARGV[1])
      for i=1, #KEYS do
        redis.call('SET', KEYS[i], ARGV[i+1], 'PX', ttl)
      end
      return 'OK'
      `;

    await this.forEachBucket(obj, async (hashTag, keyVals) => {
      const keys = [];
      const values = [];

      for (const key in keyVals) {
        keys.push(createKey(hashTag, key));
        values.push(keyVals[key]);
      }

      // cluster lua script must be eval on each slot master node
      const master = await this.hashTagProvider.getClientByHashTag(hashTag);
      await master.sendCommand([
        'EVAL',
        mSetScript,
        String(keys.length),
        ...keys,
        String(ttl),
        ...values,
      ]);
    });
  }

  /**
   * Sets multiple key-value pairs with individual TTLs.
   * @param obj Object containing key-value pairs
   * @param ttls Object containing TTLs for each key
   * @example
   * await redisClusterService.mSetPxTTLs({ foo: '1', bar: '2' }, { foo: 1000, bar: 2000 });
   */
  public async mSetPxTTLs(
    obj: Record<string, string>,
    ttls: Record<string, number>,
  ): Promise<void> {
    const mSetScriptWithDifferentTTLs = `
      for i=1, #KEYS do
        local value = ARGV[i*2-1]
        local ttl = tonumber(ARGV[i*2])
        redis.call('SET', KEYS[i], value, 'PX', ttl)
      end
      return 'OK'
      `;

    await this.forEachBucket(obj, async (hashTag, keyVals) => {
      const keys = [];
      const valuesAndTTLs = [];

      for (const key in keyVals) {
        const ttl = Number(ttls[key]);
        keys.push(createKey(hashTag, key));
        valuesAndTTLs.push(keyVals[key]);
        valuesAndTTLs.push(String(isNaN(ttl) ? 0 : ttl));
      }

      const master = await this.hashTagProvider.getClientByHashTag(hashTag);
      await master.sendCommand([
        'EVAL',
        mSetScriptWithDifferentTTLs,
        String(keys.length),
        ...keys,
        ...valuesAndTTLs,
      ]);
    });
  }

  /**
   * Sets multiple fields in multiple hashes with individual TTLs.
   * @param data
   * @param TTLsMs
   */
  public async hSetWithTTLs({
    data,
    TTLsMs,
  }: HSetWithTTLsInput): Promise<void> {
    const hSetScript = `
    local offset = 0
    for i=1,#KEYS do
      local ttl = tonumber(ARGV[offset + 2])
      local num_fields = tonumber(ARGV[offset + 1])
      local field_value_pairs = {}
      for j=1,num_fields*2 do
        table.insert(field_value_pairs, ARGV[offset+2+j])
      end
      redis.call('HSET', KEYS[i], unpack(field_value_pairs))
      if ttl > 0 then
        redis.call('PEXPIRE', KEYS[i], ttl)
      end
      offset = offset + 2 + num_fields*2
    end
    `;

    await this.forEachBucket(data, async (hashTag, keyVals) => {
      const command: string[] = ['EVAL', hSetScript];

      const keys: string[] = [];
      const numOfFieldsAndTTLAndFieldsAndValues: string[] = [];
      for (const key in keyVals) {
        const ttl = TTLsMs[key] || 0;
        keys.push(createKey(hashTag, key));

        const values = keyVals[key];
        numOfFieldsAndTTLAndFieldsAndValues.push(
          Object.keys(values).length.toString(),
        );
        numOfFieldsAndTTLAndFieldsAndValues.push(ttl.toString());
        for (const field in values) {
          numOfFieldsAndTTLAndFieldsAndValues.push(field);
          numOfFieldsAndTTLAndFieldsAndValues.push(values[field]);
        }
      }

      command.push(keys.length.toString());
      command.push(...keys);
      command.push(...numOfFieldsAndTTLAndFieldsAndValues);

      /**
       * COMMAND PATTERN: EVAL script numberOfKeys [key1 ...] [(numberOfFields TTL [(field1 value1) ...]) ...]
       * EXAMPLE: EVAL script 2 key1 key2 3 1000 field1 value1 field2 value2 field3 value3 5000 2 field1 value1 field2 value2
       */
      const master = await this.hashTagProvider.getClientByHashTag(hashTag);
      await master.sendCommand(command);
    });
  }

  /**
   * Deletes multiple keys from the cluster.
   * @param keys Array of keys to delete
   * @example
   * await redisClusterService.del(['foo', 'bar']);
   */
  public async del(keys: string[]): Promise<void> {
    await this.forEachBucket(keys, async (hashTag, batchKeys) => {
      await this.cluster.del(batchKeys.map((k) => createKey(hashTag, k)));
    });
  }

  /**
   * Gets the TTL (in ms) for multiple keys.
   * @param keys Array of keys
   * @returns Promise resolving to an array of TTLs
   * @example
   * const ttls = await redisClusterService.pttl(['foo', 'bar']);
   */
  public async pttl(keys: string[]): Promise<number[]> {
    const results: Record<string, number> = {};
    const batchTTLScript = `
    local keys = KEYS  
    local result = {}  

    for i, key in ipairs(keys) do
        local ttl = redis.call("PTTL", key)  
        result[i] = ttl  
    end

    return result  
    `;

    await this.forEachBucket(keys, async (hashTag, batchKeys) => {
      const command: string[] = [
        'EVAL',
        batchTTLScript,
        String(batchKeys.length),
      ];

      for (let i = 0; i < batchKeys.length; i++) {
        const key = batchKeys[i];

        command.push(createKey(hashTag, key));
      }

      const master = await this.hashTagProvider.getClientByHashTag(hashTag);

      const res = await master.sendCommand(command);

      for (let i = 0; i < batchKeys.length; i++) {
        results[batchKeys[i]] = res[i];
      }
    });

    return keys.map((k) => results[k]);
  }

  /**
   * Executes a pipeline of commands for a set of keys.
   * @param keys Array of keys
   * @param fn Function to execute pipeline commands
   * @returns Promise resolving to a record of results
   * @example
   * const results = await redisClusterService.pipe(['foo', 'bar'], (pipeline, keys, hashKeys) => {
   *   hashKeys.forEach(key => pipeline.get(key));
   * });
   */
  public async pipe(
    keys: string[],
    fn: (
      pipeline: ReturnType<typeof this.cluster.multi>,
      keys: string[],
      hashKeys: string[],
    ) => void,
  ): Promise<Record<string, string>> {
    const results = {};
    await this.forEachBucket(keys, async (hashTag, keys) => {
      const pipeline = this.cluster.multi();
      const hashKeys = keys.map((k) => createKey(hashTag, k));
      fn(pipeline, keys, hashKeys);
      const res = await pipeline.exec();
      for (let i = 0; i < keys.length; i++) {
        results[keys[i]] = res[i];
      }
    });

    return results;
  }

  private async forEachBucket(
    keys: string[],
    fn: (hashTag: string, items: string[]) => Promise<void>,
  ): Promise<void>;
  private async forEachBucket<T>(
    obj: Record<string, T>,
    fn: (hashTag: string, items: Record<string, T>) => Promise<void>,
  ): Promise<void>;
  private async forEachBucket<T>(
    keysOrObj: string[] | Record<string, T>,
    fn: (hashTag: string, items: any) => Promise<void>,
  ): Promise<void> {
    const batches = Array.isArray(keysOrObj)
      ? this.hashTagProvider.buildKeyBuckets(keysOrObj)
      : this.hashTagProvider.buildBuckets(keysOrObj);
    const command = async (): Promise<void> => {
      await Promise.all(
        Object.entries(batches).map(([hashTag, items]) => fn(hashTag, items)),
      );
    };
    await this.hashTagProvider.sendCommand(command);
  }
}

function createKey(hashTag: string, key: string): string {
  return `{${hashTag}}:${key}`;
}
