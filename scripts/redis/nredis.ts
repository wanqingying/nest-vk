process.env.DEBUG = 'redis:*';
import {
  createCluster,
  createClient,
  RedisClientType,
  RedisClusterType,
} from 'redis';
// import { RedisCluterMultiCommandType } from 'redis/dist';
import calculateSlot from 'cluster-key-slot';

async function main3() {
  // ec2-44-243-110-192.us-west-2.compute.amazonaws.com
  const host = 'ec2-44-243-110-192.us-west-2.compute.amazonaws.com';
  const port = 6380;
  const client = createClient({
    url: `redis://${host}:${port}`,
    // socket: {
    // 	tls: true,
    // 	rejectUnauthorized: false, // 允许自签名证书
    // },
  });
  await client.connect();
  await client.set('testfoo', 'testbar');
  const result = await client.get('testfoo');
  console.log('redis client connected, result:', result);
  console.log('redis client connected');
  const nodes = await client.sendCommand(['CLUSTER', 'NODES']);
  console.log('redis cluster nodes:', nodes);
  const cluster = createCluster({
    rootNodes: [
      {
        url: `redis://${host}:${port}`,
      },
    ],
    nodeAddressMap: (addr) => {
      const port = addr.split(':')[1];
      return {
        host: host,
        port: Number(port),
      };
    },
  });
  await cluster.connect();
  console.log('redis cluster connected');
  await cluster.set('testfoo', 'testbar');
  const clusterResult = await cluster.get('testfoo');
  console.log('redis cluster result:', clusterResult);
}

main3().catch(console.error);
