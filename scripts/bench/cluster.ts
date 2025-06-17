// import { OnModuleInit, Injectable } from '@nestjs/common';
import calculateSlot from 'cluster-key-slot';
import assert from 'node:assert';
import util from 'node:util';
import {
  createClient,
  createCluster,
  RedisClusterType,
  RedisClusterOptions,
  RedisClientType,
  defineScript,
} from 'redis';

export interface ClusterNodeConfig {
  host: string;
  port: number;
}

export async function getMasterNodes() {
  const client = createClient({
    url: 'redis://redis-cluster:6379',
  });

  client.on('error', (err) => console.log('Redis Client Error', err));

  await client.connect();
  const nodesInfo = (await client.sendCommand(['CLUSTER', 'NODES'])) as string;
  console.log('nodesInfo', nodesInfo);
  await client.quit();

  const masterNodes = nodesInfo
    .split('\n')
    .filter((line) => line.includes('master'))
    .map((line) => {
      const [id, addr] = line.split(' ');
      const [host, port] = addr.split(':');
      return { host, port: parseInt(port) };
    });
  console.log('masterNodes', masterNodes);
  return masterNodes;
}

export async function getCluster() {
  console.log('get redis cluster');
  const nodes = await getMasterNodes();
  const cluster = createCluster({
    rootNodes: nodes.map((d) => {
      return {
        socket: {
          host: d.host,
          port: d.port,
        },
      };
    }),
    useReplicas: true,
    minimizeConnections: false,
    defaults: {
      socket: {
        connectTimeout: 5000,
        tls: false,
      },
      pingInterval: 8000,
    },
  });

  cluster.on('error', async (err) => {
    console.log('Redis Client Error', err);
  });
  cluster.on('end', () => {
    console.log('Redis connection ended');
  });
  cluster.on('close', () => {
    console.log('Redis connection closed');
  });
  cluster.on('ready', () => {
    console.log('redis ready');
  });
  cluster.on('reconnecting', () => {
    console.log('redis reconnecting');
  });
  cluster.on('node error', (err) => {
    console.log('redis node error', err);
  });
  console.log('cluster do foo');

  await cluster.connect();
  return cluster;
}

export class ClusterConfig {
  public constructor(config: ClusterConfig) {
    Object.assign(this, config);
  }
  public nodes?: ClusterNodeConfig[];
  public host!: string;
  public port!: number;
  public clusterOptions?: Partial<RedisClusterOptions>;
  public global?: boolean = true;
  public slotsRefreshInterval: number = 5000;
}

export interface LuaScriptConfig {
  uniqueName: string;
  script: string;
  sha?: string;
}

export class RedisClusterBatch {
  private cluster: RedisClusterType;
  private instanceId = Math.random().toString(36).substring(4);
  // Map<master-id, hashtag> each {hashtag}xxx is distribute to the master node
  private hashtags = new Map<string, string>();
  private masterWithTags = new Map<string, RedisClientType>();
  private scripts = new Map<string, LuaScriptConfig>();
  private logger = console;
  public constructor(private readonly config: ClusterConfig) {}

  private static instance: RedisClusterBatch;

  public static async getInstance() {
    if (this.instance) return this.instance;
    const cmd = new RedisClusterBatch({
      host: 'redis-cluster',
      port: 6379,
      slotsRefreshInterval: 5000,
    });

    await cmd.init();
    this.instance = cmd;
    return cmd;
  }

  //   public async loadScripts(scripts: LuaScriptConfig[]) {
  // 	const res=await Promise.all(
  // 		scripts.map(async sc=>{
  // 			return this.cluster.masters.forEach(async n=>{
  // 				const client=n.client as RedisClientType;
  // 				client.scriptLoad(sc.script)
  // 			})
  // 		})
  // 	)

  //   }

  public async init(): Promise<void> {
    await this.onModuleInit();
  }

  public async onModuleInit(): Promise<void> {
    let nodes: ClusterNodeConfig[] = [];

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
        clusterNodes: util.inspect(nodes),
        correlationId: this.instanceId,
      });
    }
    await this.initCluster(nodes);
    await this.health();
    this.discoverHashTags();
    this.subscribeClusterSlots();
  }

  public async getClusterNodes(): Promise<ClusterNodeConfig[]> {
    const client = createClient({
      url: `redis://${this.config.host}:${this.config.port}`,
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
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            const jitter = Math.floor(Math.random() * 200);
            const delay = Math.min(Math.pow(2, retries) * 100, 9000);
            return delay + jitter;
          },
        },
      },
    };
    const options = Object.assign(defaultOptions, this.config.clusterOptions, {
      rootNodes: nodes.map((n) => {
        return {
          socket: {
            host: n.host,
            port: n.port,
          },
        };
      }),
    });
    this.logger.log('InitRedisClusterStart', {
      correlationId: this.instanceId,
      options: util.inspect(options),
    });
    this.cluster = createCluster(options);
    this.cluster.addListener('ready', () => {
      this.logger.log('InitRedisClusterReady', {
        correlationId: this.instanceId,
        options: util.inspect(options),
      });
    });
    this.cluster.addListener('error', (err) => {
      this.logger.warn('RedisClusterError', {
        correlationId: this.instanceId,
        options: util.inspect(options),
        error: util.inspect(err),
      });
    });
    await this.cluster.connect();
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
	test with 30000 kv (usual feature size)
	mGet Cost= 40ms
	cluster.get cost= 247ms
   */
  public async mGet(cmds: string[]): Promise<Record<string, string | null>> {
    const batches = new Map<string, string[]>();
    for (let i = 0; i < cmds.length; i++) {
      const key = cmds[i];
      const sid = this.getHashTag(key);
      if (!batches.has(sid)) {
        batches.set(sid, []);
      }
      batches.get(sid).push(key);
    }
    const entry = Array.from(batches.entries());
    const results = {};
    await Promise.all(
      entry.map(async ([hashId, keys]) => {
        for (let i = 0; i < keys.length; i++) {
          keys[i] = `{${hashId}}:${keys[i]}`;
        }
        const res = await this.cluster.mGet(keys);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i].substring(keys[i].indexOf(':') + 1);
          results[key] = res[i];
        }
      }),
    );
    return results;
  }

  /**
	test with 30000 kv (usual feature size)
	mSet Cost= 23ms
	cluster.set Cost= 201ms
	redis cluster keys balance: 8354,8414,8734,8520,8722,8650,8606
   */
  public async mSet(obj: Record<string, string>): Promise<void> {
    const batches = this.getBatchedKeys(Array.from(Object.keys(obj)));
    const ent = Array.from(Object.entries(batches));
    await Promise.all(
      ent.map(async ([id, keys]) => {
        const cmds: string[] = [];
        for (let i = 0; i < keys.length; i++) {
          cmds.push(`{${id}}:${keys[i]}`, obj[keys[i]]);
        }
        await this.cluster.mSet(cmds);
      }),
    );
  }

  /**
   * set with ttl ms
	test 30000 kv (usual feature size) set with ttl
	mSet Cost=  21ms
	mSetPx Cost=  18ms
	cluster.set Cost= 228ms
	pipeline+cluster.set Cost= 171ms
   */
  public async mSetPx(obj: Record<string, string>, ttl: number): Promise<void> {
    const batches = this.getBatchedKeys(Array.from(Object.keys(obj)));
    const mSetScript = `
	local ttl = tonumber(ARGV[1])
	for i=1, #KEYS do
	  redis.call('SET', KEYS[i], ARGV[i+1], 'PX', ttl)
	end
	return 'OK'
  `;
    const entry = Array.from(Object.entries(batches));
    await Promise.all(
      entry.map(async ([id, batchKeys], i) => {
        const keys = [];
        const values = [];

        for (let i = 0; i < batchKeys.length; i++) {
          keys.push(`{${id}}:${batchKeys[i]}`);
          values.push(obj[batchKeys[i]]);
        }
        // cluster lua script must be eval on each slot master node
        const master = this.masterWithTags.get(id);
        await master.eval(mSetScript, {
          keys,
          arguments: [String(ttl), ...values],
        });
      }),
    );
  }

  public async mSetPxTTLs(
    obj: Record<string, string>,
    ttls: Record<string, number>,
  ): Promise<void> {
    const batches = this.getBatchedKeys(Array.from(Object.keys(obj)));
    const mSetScriptWithDifferentTTLs = `
    local result = {}
    for i=1, #KEYS do
      local ttl = tonumber(ARGV[i*2])
      local value = ARGV[i*2-1]
      redis.call('SET', KEYS[i], value, 'PX', ttl)
    end
    return 'OK'
  `;
    const entry = Array.from(Object.entries(batches));
    await Promise.all(
      entry.map(async ([id, batchKeys], i) => {
        const keys = [];
        const valuesAndTTLs = [];

        for (let i = 0; i < batchKeys.length; i++) {
          const key = batchKeys[i];
          const ttl = Number(ttls[key]);
          keys.push(`{${id}}:${key}`);
          valuesAndTTLs.push(obj[key]);
          valuesAndTTLs.push(String(isNaN(ttl) ? 0 : ttl));
        }
        // cluster lua script must be eval on each slot master node
        const master = this.masterWithTags.get(id);

        await master.eval(mSetScriptWithDifferentTTLs, {
          keys,
          arguments: valuesAndTTLs,
        });
      }),
    );
  }
  public async del(keys: string[]): Promise<void> {
    const batches = this.getBatchedKeys(keys);
    const entry = Array.from(Object.entries(batches));
    await Promise.all(
      entry.map(async ([id, batchKeys]) => {
        await this.cluster.del(batchKeys.map((k) => `{${id}}:${k}`));
      }),
    );
  }
  async pttl(keys: string[]): Promise<number[]> {
    const batches = this.getBatchedKeys(keys);
    const entry = Array.from(Object.entries(batches));
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
    await Promise.all(
      entry.map(async ([id, batchKeys]) => {
        const master = this.masterWithTags.get(id);
        const res = (await master.eval(batchTTLScript, {
          keys: batchKeys.map((k) => `{${id}}:${k}`),
        })) as number[];
        for (let i = 0; i < batchKeys.length; i++) {
          results[batchKeys[i]] = res[i];
        }
      }),
    );
    return keys.map((k) => results[k]);
  }
  /**
	test with 30000 kv (usual feature size) 
	cluster.get cost= 183ms
	pipeline.get cost= 77ms
   */
  public async pipe(
    keys: string[],
    fn: (
      pipeline: ReturnType<typeof this.cluster.multi>,
      keys: string[],
      hashKeys: string[],
    ) => void,
  ): Promise<Record<string, string>> {
    const batches = this.getBatchedKeys(keys);
    const entry = Array.from(Object.entries(batches));
    const results = {};
    await Promise.all(
      entry.map(async ([hashId, keys]) => {
        const pipeline = this.cluster.multi();
        const hashKeys = keys.map((k) => `{${hashId}}:${k}`);
        fn(pipeline, keys, hashKeys);
        const res = await pipeline.exec();
        for (let i = 0; i < keys.length; i++) {
          results[keys[i]] = res[i];
        }
      }),
    );
    return results;
  }

  private getBatchedKeys(keys: string[]): Record<string, string[]> {
    const batches: Record<string, string[]> = {};
    for (const key of keys) {
      const tag = this.getHashTag(key);
      if (!batches[tag]) {
        batches[tag] = [];
      }
      batches[tag].push(key);
    }
    return batches;
  }

  private getHashTag(key: string): string {
    const slot = calculateSlot(key);
    const master = this.cluster.slots[slot].master;
    return this.hashtags.get(master.id);
  }

  private async discoverHashTags(): Promise<void> {
    const cluster = this.cluster;
    const nodesLen = cluster.masters.length;
    let i = 1;
    while (this.hashtags.size < nodesLen) {
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
  }

  private slotsCache: string[] = [];

  // there is 2 ways subscribe cluster slots. this ensure slots sync with redis.
  // 1.(optional) send CLUSTER SLOTS command. see https://github.com/redis/jedis/blob/master/src/main/java/redis/clients/jedis/JedisClusterInfoCache.java#L66

  // 2.(choose this) sync with node-redis. don't send cmd. this is easy+fast+resonable. see https://github.com/redis/node-redis/blob/master/packages/client/lib/cluster/cluster-slots.ts#L569
  private subscribeClusterSlots(): void {
    setInterval(() => {
      const slots = this.cluster.slots;
      const isInit = this.slotsCache.length === 0;
      let isChanged = false;
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].master.id !== this.slotsCache[i]) isChanged = true;
        this.slotsCache[i] = slots[i].master.id;
      }
      if (isChanged && !isInit) {
        this.logger.log('RedisClusterSlotsChanged', {
          correlationId: this.instanceId,
        });
        this.hashtags.clear();
        this.discoverHashTags();
      }
    }, this.config.slotsRefreshInterval || 5000);
  }
}
