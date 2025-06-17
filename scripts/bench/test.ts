import { getCluster, RedisClusterBatch } from './cluster';

async function main() {
  const cmd = new RedisClusterBatch({
    host: 'redis-cluster',
    port: 6379,
    slotsRefreshInterval: 5000,
  });

  await cmd.init();

  await cmd.mSetPxTTLs(
    {
      keyv1: 'valuev1',
      keyv5: 'valuev1',
      keyv9: 'valuev1',
    },
    { keyv1: 2000, keyv5: 300, keyv9: 50 },
  );
  const result = await cmd.mGet(['keyv1',"keyv5", 'keyv9']);
  const ttls = await cmd.pttl(['keyv1',"keyv5", 'keyv9']);
  console.log('result', result, ttls);
}

main().catch(console.error);
