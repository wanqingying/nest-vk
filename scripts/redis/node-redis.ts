process.env.DEBUG = 'redis:*';
import {
  createCluster,
  createClient,
  RedisClientType,
  RedisClusterType,
} from 'redis';
import calculateSlot from 'cluster-key-slot';
// const { createCluster, createClient } = require('redis');

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
function slotByKey(key: string) {
  // A more randomized hash function for slot calculation
  const hash = (key: string) => {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = Math.imul(h ^ key.charCodeAt(i), 0x5bd1e995);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0; // Ensure unsigned 32-bit integer
  };

  const slot = hash(key) % 16384;
  return slot;
}
async function main() {
  const cluster = await getCluster();
  function hashNumber(num: number): number {
    let hash = num;
    hash = Math.imul(hash ^ 0x5bd1e995, 0x5bd1e995); // 混合乘法和异或操作
    hash = (hash << 13) | (hash >>> 19); // 左移和右移混合
    return (hash >>> 0) % 146; // 确保结果为无符号 32 位整数
  }

  function hashKey(key: string) {
    const s = slotByKey(key);
    const b = cluster.getSlotRandomNode(s);
    const bsId = b.id;

    return Number(b.host.replaceAll('.', ''));
  }
  const tStart5 = Date.now();
  let arr = new Set();
  // for (let i = 0; i < 30000; i++) {
  //   const b = hashKey(`key-${i}`);
  //   arr.add(b);
  // }
  // console.log('hashKey cost', Date.now() - tStart5, arr);

  async function mset(vals: string[]) {
    const slots = new Map<number, string[]>();
    for (let i = 0; i < vals.length; i += 2) {
      const key = vals[i];
      const value = vals[i + 1];

      const sk = hashKey(key);
      if (!slots.has(sk)) {
        slots.set(sk, []);
      }
      slots.get(sk).push(key, value);
    }
    const ent = Array.from(slots.entries());
    await Promise.all(
      ent.map(async ([sk, cmds]) => {
        // add ip to hash key
        for (let i = 0; i < cmds.length; i += 2) {
          const key = cmds[i];
          cmds[i] = `{${sk}}${key}`;
        }
        await cluster.mSet(cmds);
      }),
    );
  }

  async function mget(vals: string[]) {
    const tStart1 = Date.now();
    const slots = new Map<number, string[]>();
    for (let i = 0; i < vals.length; i++) {
      const key = vals[i];
      const sk = hashKey(key);

      if (!slots.has(sk)) {
        slots.set(sk, []);
      }
      slots.get(sk).push(key);
    }
    const ent = Array.from(slots.entries());
    const results = {};
    console.log('mget cost1 =', Date.now() - tStart1);
    const tStart2 = Date.now();
    await Promise.all(
      ent.map(async ([sk, keys]) => {
        // add ip to hash key
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          keys[i] = `{${sk}}${key}`;
        }
        const tStart = Date.now();
        const res = await cluster.mGet(keys);
        console.log(
          'mget ',
          sk,
          ' cost',
          Date.now() - tStart,
          ' cont',
          keys.length,
        );
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i].replace(`{${sk}}`, '');
          results[key] = res[i];
        }
      }),
    );
    console.log('mget cost2 =', Date.now() - tStart2);
    return results;
  }
  async function clearRedisKeys() {}
  // await clearRedisKeys();

  await cluster.set('hello', 'cluster');
  // setInterval(async () => {
  //   const value = await cluster.get('hello');
  // }, 2000);
  // setTimeout(async () => {
  //   console.log('cluster mset mget');
  //   // await cluster.mSet(['foo', 'bar', 'hello', 'world']);
  //   const cmds = [];
  //   for (let i = 0; i < 30000; i++) {
  //     cmds.push(`key${i}`, `val${i}`);
  //   }
  //   for (let i = 0; i < 30000; i++) {
  //     // test more random keys
  //     cmds.push(Math.random().toString(36).substring(2), `val${i}`);
  //   }
  //   await mset(cmds);
  //   console.log('mset done');
  //   // cluster.getSlotRandomNode;
  //   // const value = await cluster.mGet(['foo', 'hello']);
  //   const value = await mget(cmds.filter((_, i) => i % 2 === 0));
  //   const nodes = cluster.slots;
  //   let clients = new Map<string, RedisClientType>();
  //   for (const node of nodes) {
  //     const host = node.master.host;
  //     clients.set(host, node.master.client as RedisClientType);
  //     // const client=node.master.client as RedisClientType;
  //     // const keys=await client.keys('*');
  //     // console.log(`node ${node.master.host} keys`, keys.length);
  //   }
  //   const list = Array.from(clients.entries());
  //   for (const [host, client] of list) {
  //     const keys = await client.keys('*');
  //     console.log(`node ${host} keys`, keys.length);
  //   }

  //   // const node=cluster.getRandomNode();
  //   // const client=node.client as RedisClientType;

  //   // const allKeys=await client.keys('*');
  //   // console.log('all keys', allKeys);
  // }, 4000);
  setTimeout(async () => {
    console.log('cluster balance');

    const nodes = cluster.slots;
    let clients = new Map<string, RedisClientType>();
    for (const node of nodes) {
      const host = node.master.host;
      clients.set(host, node.master.client as RedisClientType);
    }
    const list = Array.from(clients.entries());
    for (const [host, client] of list) {
      const keys = await client.keys('*');
      console.log(`node ${host} keys`, keys.length);
    }
  }, 5000);
  let bct = 70000;
  const cmds = [];
  for (let i = 0; i < bct; i++) {
    cmds.push(`key${i}`, `val${i}`);
  }
  const b = cluster.getSlotRandomNode(30);
  const cb = cluster.nodeClient(b) as RedisClientType;

  setTimeout(async () => {
    console.log('cluster mget');
    // await cluster.mSet(['foo', 'bar', 'hello', 'world']);
    const tStart1 = Date.now();
    await mset(cmds);
    console.log('mset done cost', Date.now() - tStart1);
    const tStart = Date.now();
    const value = await mget(cmds.filter((_, i) => i % 2 === 0));
    console.log('mget key2=', value['key2']);
    console.log('mget done', Date.now() - tStart);
  }, 4000);
  setTimeout(async () => {
    console.log('cluster get all');
    const list = [];
    for (let i = 0; i < cmds.length; i += 2) {
      list.push([cmds[i], cmds[i + 1]]);
    }
    let tStart1 = Date.now();
    await Promise.all(
      list.map(async ([k, v]) => {
        await cluster.set(k, v);
      }),
    );
    console.log('set all done cost', Date.now() - tStart1);
    const keys = cmds.filter((_, i) => i % 2 === 0);
    const tStart = Date.now();
    const res = await Promise.all(
      keys.map(async (k) => {
        return await cluster.get(k);
      }),
    );
    console.log('get all ', res.splice(0, 10));
    console.log('get all done', Date.now() - tStart);
  }, 4200);

  // await cluster.quit();
}
function getMasterNodes2(cluster: RedisClusterType) {
  const slots = cluster.slots;
  const map = new Map<string, RedisClientType>();
  for (const slot of slots) {
    const m = slot.master;
    map.set(m.address, m.client as RedisClientType);
  }
  const nodes = Array.from(map.values());
  return nodes;
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

async function printClusterKeysCont(cluster: RedisClusterType) {}
async function main3() {
  const cluster = (await getCluster()) as RedisClusterType;
  await flushAllKeysInCluster(cluster);

  async function setKeys(key: string) {
    const ns = calculateSlot(key);
    const st = cluster.getSlotRandomNode(ns);
    const client = st.client as RedisClientType;
    console.log('slot ', st.address);

    client.mSet([key, 'bar']);

    const value = await client.mGet([key]);
    console.log('value', value);
  }

  const map = new Map<string, RedisClientType>();
  async function getSingleClient(host: any, port: any) {
    const url = `redis://${host}:${port}`;
    if (map.has(url)) return map.get(url);

    const client = createClient({
      url: `redis://${host}:${port}`,
    }) as RedisClientType;
    await client.connect();
    map.set(url, client);
    return client;
  }
  async function mSetV2(cmds: string[]) {
    const clients = new Map<string, string[]>();
    for (let i = 0; i < cmds.length; i += 2) {
      const key = cmds[i];
      const value = cmds[i + 1];
      const ns = calculateSlot(key);
      const st = cluster.getSlotRandomNode(ns);
      const url=`${st.host}:${st.port}`
      // const client = st.client as RedisClientType;
      if (!clients.has(url)) {
        clients.set(url, []);
      }
      console.log('slot ', st.address);
      clients.get(url).push(key, value);
    }
    const ent = Array.from(clients.entries());
    await Promise.all(
      ent.map(async ([str, cmds]) => {
        const [host, port] = str.split(':');
        console.log('host', host, 'port', port);
        const client = await getSingleClient(host, port);
        await client.mSet(cmds);
      }),
    );
    // const val1 = await cluster.get(cmds[0]);
    // console.log('mset val1', val1);
  }
  await setKeys('foo');
  // const sl1 = calculateSlot('foo2');
  // const sl2 = calculateSlot('foo3');
  // const d1 = cluster.getSlotRandomNode(sl1);
  // const d2 = cluster.getSlotRandomNode(sl2);
  // cluster.slots[1].master.address;
  // console.log(`foo2 slot=${sl1} node=${d1.address}`);
  // console.log(`foo3 slot=${sl2} node=${d2.address}`);
  await mSetV2(['foo2', 'bar2', 'foo3', 'bar3']);

  // await cluster.quit();
}

// getMasterNodes().catch(console.error);
main3().catch(console.error);
