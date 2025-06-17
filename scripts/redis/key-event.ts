import {
  createCluster,
  createClient,
  RedisClientType,
  RedisClusterType,
} from 'redis';
import { scheduler } from 'node:timers/promises';

async function getClient() {
  const client = createClient({
    url: 'redis://redis-1:6379',
  });

  client.on('error', (err) => console.log('Redis Client Error', err));

  await client.connect();
  return client;
}

async function setConfig() {
  const client2 = await getClient();
  //   CONFIG SET notify-keyspace-events Ex
  await client2.sendCommand(['CONFIG', 'SET', 'notify-keyspace-events', 'Ex']);
  await scheduler.wait(100);
  console.log('Configured keyspace notifications for expired events');
  await client2.quit();
}

async function main3() {
  await setConfig();
  const subscriber = await getClient();
  const client2 = await getClient();
  subscriber.subscribe('__keyevent@0__:expired', (channel, message) => {
    console.log('Received key expiration notification:', channel, message);
  });

  await client2.set('foo', 'bar', {
    PX: 200,
  });
  console.log('Set key "foo" with expiration of 200 milliseconds');
  await scheduler.wait(5000);
}

main3().catch(console.error);
