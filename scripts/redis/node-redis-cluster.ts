process.env.DEBUG = 'redis:*';
import {
  createCluster,
  createClient,
  RedisClientType,
  RedisClusterType,
} from 'redis';
// import { RedisCluterMultiCommandType } from 'redis/dist';
import calculateSlot from 'cluster-key-slot';

async function getMasterNodes() {
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

async function getCluster() {
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
function getMasterNodes2(cluster: RedisClusterType) {
  return cluster.masters.map((t) => t.client) as RedisClientType[];
}

async function flushAllKeysInCluster(cluster: RedisClusterType) {
  try {
    const nodes = getMasterNodes2(cluster);
    for (const node of nodes) {
      await node.flushDb();
    }
    console.log('All keys in the cluster have been flushed.');
  } catch (err) {
    console.error('Error flushing keys in cluster:', err);
  } finally {
    // await cluster.disconnect();
  }
}

function getKvList(n: number) {
  const list = [];
  for (let i = 0; i < n; i++) {
    list.push(Math.random().toString(36).substring(2), `value${i}`);
  }
  return list;
}
function getKvListV2(n: number) {
  const res: Record<string, string> = {};
  for (let i = 0; i < n; i++) {
    const key = Math.random().toString(36).substring(2);
    const value = `value${i}`;
    res[key] = value;
  }
  return res;
}
function getKvIListV2(n: number) {
  const res: Record<string, string> = {};
  for (let i = 0; i < n; i++) {
    const key = `key${i}`;
    const value = `value${i}`;
    res[key] = value;
  }
  return res;
}

async function main3() {
  const cluster = (await getCluster()) as RedisClusterType;
  await flushAllKeysInCluster(cluster);

  async function printClusterKeysCont() {
    const nodes = getMasterNodes2(cluster);
    const len = [];
    for (const node of nodes) {
      const keys = await node.keys('*');
      len.push(keys.length);
    }
    console.log('redis cluster keys balance:', len.join(','));
  }
  const nodeshash: Map<string, string> = new Map();
  const nodes2: Map<string, RedisClientType> = new Map();
  const nodes = cluster.masters;

  function getHashId(key: string) {
    const slot = calculateSlot(key);
    const master = cluster.slots[slot].master;
    return nodeshash.get(master.id);
  }

  for (let i = 1; i < 20000; i++) {
    const ns = calculateSlot(String(i));
    const st = cluster.slots[ns].master;
    if (!nodeshash.has(st.id)) {
      nodeshash.set(st.id, String(i));
      nodes2.set(String(i), st.client as RedisClientType);
    }
    if (nodeshash.size >= nodes.length) {
      break;
    }
  }

  const map = new Map<string, RedisClientType>();
  function batchKeys(keys: string[]) {
    console.log('keys', keys);
    const batches: Record<string, string[]> = {};
    for (const key of keys) {
      const sid = getHashId(key);
      if (!batches[sid]) {
        batches[sid] = [];
      }
      batches[sid].push(key);
    }
    console.log('batches', batches);
    return batches;
  }
  function batchKeysV2(keys: string[]) {
    const batches: Record<string, string[]> = {};
    for (const key of keys) {
      const sid = getHashId(key);
      if (!batches[sid]) {
        batches[sid] = [];
      }
      batches[sid].push(key);
    }
    return batches;
  }
  async function mSetV3(obj: Record<string, string>) {
    const bs = batchKeys(Array.from(Object.keys(obj)));

    const ent = Array.from(Object.entries(bs));
    await Promise.all(
      ent.map(async ([id, keys]) => {
        const cmds: string[] = [];
        for (let i = 0; i < keys.length; i += 2) {
          cmds.push(`{${id}}:${keys[i]}`, obj[keys[i]]);
        }
        await cluster.mSet(cmds);
      }),
    );
  }

  async function mGetV3(cmds: string[]) {
    const clients = new Map<string, string[]>();
    for (let i = 0; i < cmds.length; i++) {
      const key = cmds[i];
      const sid = getHashId(key);
      if (!clients.has(sid)) {
        clients.set(sid, []);
      }
      clients.get(sid).push(key);
    }
    const ent = Array.from(clients.entries());
    const results = {};
    await Promise.all(
      ent.map(async ([hashId, cmds]) => {
        for (let i = 0; i < cmds.length; i++) {
          cmds[i] = `{${hashId}}:${cmds[i]}`;
        }
        const res = await cluster.mGet(cmds);
        for (let i = 0; i < cmds.length; i++) {
          const key = cmds[i].substring(cmds[i].indexOf(':') + 1);
          results[key] = res[i];
        }
      }),
    );
    return results;
  }

  async function mSetPx(obj: Record<string, string>, ttl: number) {
    const batches = batchKeys(Array.from(Object.keys(obj)));

    const msetScript = `
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
        const master = nodes2.get(id);
        console.log('set ', id, keys, values);
        await master.eval(msetScript, {
          keys,
          arguments: [String(ttl), ...values],
        });
      }),
    );
  }

  async function ttl(keys: string[]): Promise<number[]> {
    const batches = batchKeys(keys);
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
        const master = nodes2.get(id);
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

  async function setV3(cmds: string[]) {
    const rawCmds: string[][] = [];
    for (let i = 0; i < cmds.length; i += 2) {
      rawCmds.push([cmds[i], cmds[i + 1]]);
    }
    await Promise.all(
      rawCmds.map(async ([k, v]) => {
        await cluster.set(k, v);
      }),
    );
  }

  async function pipe(
    keys: string[],
    callback: (
      pipeline: ReturnType<typeof cluster.multi>,
      keys: string[],
      hashKeys: string[],
    ) => void,
  ) {
    const batches = batchKeys(keys);
    const entry = Array.from(Object.entries(batches));
    const results = {};
    await Promise.all(
      entry.map(async ([hashId, keys]) => {
        const pipeline = cluster.multi();
        const hashKeys = keys.map((k) => `{${hashId}}:${k}`);
        const tStart53 = Date.now();
        callback(pipeline, keys, hashKeys);

        const res = await pipeline.exec();
        // console.log('pipe exec cost=', Date.now() - tStart53);
        for (let i = 0; i < keys.length; i++) {
          results[keys[i]] = res[i];
        }
      }),
    );
    return results;
  }

  async function getV3(cmds: string[]) {
    return Promise.all(
      cmds.map(async (k) => {
        return await cluster.get(k);
      }),
    );
  }

  const kv2 = getKvListV2(30000);
  const kv3 = getKvIListV2(30000);
  console.log('test with 30000 kv (usual feature size)');
  const kvList3 = Object.entries(kv3).flat();
  const keys3 = Array.from(Object.keys(kv3));

  //   const tStart7 = Date.now();
  //   await mSetV3(kvList3);
  //     console.log('mSetCost=', Date.now() - tStart7);

  //   const tStart3 = Date.now();
  //   await mGetV3(keys3);
  //   console.log('mGet Cost=', Date.now() - tStart3);

  //   const tStart4 = Date.now();
  //   await getV3(keys3);
  //   console.log('cluster.get cost=', Date.now() - tStart4);

  // const tStart5 = Date.now();
  // await pipe(Array.from(Object.keys(kv2)), (pipeline, keys, hashKeys) => {
  //   for (let i = 0; i < keys.length; i++) {
  //     pipeline.set(hashKeys[i], kv2[keys[i]]);
  //   }
  // });
  // console.log('pipe set cost=', Date.now() - tStart5);

  //   const tStart6 = Date.now();
  //   const res = await pipe(keys3, (pipeline, keys, hashKeys) => {
  //     for (let i = 0; i < keys.length; i++) {
  //       pipeline.get(hashKeys[i]);
  //     }
  //   });
  //   console.log('pipe get cost=', Date.now() - tStart6, res[keys3[0]]);

  // const tStart12 = Date.now();
  // await mSetV3(kv3);
  // console.log('mSetV3 ok ', Date.now() - tStart12);
  // await flushAllKeysInCluster(cluster);

  // const tStart13 = Date.now();
  // await mSetPx(kv3, 2000);
  // console.log('mSetPx ok ', Date.now() - tStart13);
  // await flushAllKeysInCluster(cluster);

  // const tStart2 = Date.now();
  // await setV3(kvList3);
  // console.log('clusterSetCost=', Date.now() - tStart2);
  // await flushAllKeysInCluster(cluster);

  // const tStart8 = Date.now();
  // await pipe(keys3, async (pipeline, keys, hashKeys) => {
  //   for (let i = 0; i < keys.length; i++) {
  //     pipeline.set(hashKeys[i], kv3[keys[i]], {
  //       PX: 2000,
  //     });
  //   }
  // });
  // console.log('pipe set cost=', Date.now() - tStart8);

  const records = {
    'fea:post:ranking_v2_score:id_empty:post_score': '"_empty_"',
    'fea:post:ranking_v2_score:id_a:post_score': '"id-a-val"',
    'fea:post:ranking_v2_score:id_b:post_score': '"id-b-val"',
    'fea:post:ranking_v2_score:hm6ztslrp:post_score': '"hm6ztslrp-val"',
    'fea:post:ranking_v2_score:inbdojtf9w:post_score': '"inbdojtf9w-val"',
  };

  await mSetPx(records, 3000);
  const res = await mGetV3(Array.from(Object.keys(records)));
  const ttl3 = await ttl(Array.from(Object.keys(records)));
  console.log('ttl', ttl3);

  console.log('redis result', res);

  await printClusterKeysCont();
}

main3().catch(console.error);
