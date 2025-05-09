process.env.DEBUG = 'redis:*';
import {
  createCluster,
  createClient,
  RedisClientType,
  RedisClusterType,
} from 'redis';
// import { RedisCluterMultiCommandType } from 'redis/dist';
import calculateSlot from 'cluster-key-slot';
import { pipeline } from 'stream';

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
    //   list.push(Math.random().toString(36).substring(2), `value${i}`);
    // keys.push(Math.random().toString(36).substring(2));
    // vals.push(`value${i}`);
    const key = Math.random().toString(36).substring(2);
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
  const nodes = getMasterNodes2(cluster);

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
    }
    if (nodeshash.size >= nodes.length) {
      break;
    }
  }

  const map = new Map<string, RedisClientType>();

  async function mSetV3(cmds: string[]) {
    const clients = new Map<string, string[]>();
    for (let i = 0; i < cmds.length; i += 2) {
      const key = cmds[i];
      const value = cmds[i + 1];
      const sid = getHashId(key);
      if (!clients.has(sid)) {
        clients.set(sid, []);
      }
      clients.get(sid).push(key, value);
    }
    const ent = Array.from(clients.entries());
    await Promise.all(
      ent.map(async ([id, cmds]) => {
        // const hashId = id.substring(0, 2) + id.substring(id.length - 2);
        const hashId = id;
        for (let i = 0; i < cmds.length; i += 2) {
          cmds[i] = `{${hashId}}:${cmds[i]}`;
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
    const batches = new Map<string, string[]>();
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const sid = getHashId(key);
      if (!batches.has(sid)) {
        batches.set(sid, []);
      }
      batches.get(sid).push(key);
    }
    const entry = Array.from(batches.entries());
    const results = {};
    await Promise.all(
      entry.map(async ([hashId, keys]) => {
        const pipeline = cluster.multi();
        const hashKeys = keys.map((k) => `{${hashId}}:${k}`);
        callback(pipeline, keys, hashKeys);
        const tStart = Date.now();
        const res = await pipeline.exec();
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

  const list = getKvList(5000);
  const kv2 = getKvListV2(30000);
  const kv3 = getKvListV2(30000);
  console.log('test with 30000 kv (usual feature size)');
  const kvList3 = Object.entries(kv3).flat();
  const keys3 = Array.from(Object.keys(kv3));

  const tStart7 = Date.now();
  await mSetV3(kvList3);
  //   console.log('mSetCost=', Date.now() - tStart7);
  const tStart2 = Date.now();
  await setV3(kvList3);
  //   console.log('clusterSetCost=', Date.now() - tStart2);


//   const tStart3 = Date.now();
//   await mGetV3(keys3);
//   console.log('mGet Cost=', Date.now() - tStart3);
  const tStart4 = Date.now();
  await getV3(keys3);
  console.log('cluster.get cost=', Date.now() - tStart4);


    // const tStart5 = Date.now();
    // await pipe(Array.from(Object.keys(kv2)), (pipeline, keys, hashKeys) => {
    //   for (let i = 0; i < keys.length; i++) {
    //     pipeline.set(hashKeys[i], kv2[keys[i]]);
    //   }
    // });
    // console.log('pipe set cost=', Date.now() - tStart5);


    const tStart6 = Date.now();
    const res = await pipe(keys3, (pipeline, keys, hashKeys) => {
      for (let i = 0; i < keys.length; i++) {
        pipeline.get(hashKeys[i]);
      }
    });
    console.log('pipe get cost=', Date.now() - tStart6, res[keys3[0]]);
  await printClusterKeysCont();
}

// getMasterNodes().catch(console.error);
main3().catch(console.error);
