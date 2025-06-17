import Benchmark, { Deferred, Event } from 'benchmark';
var suite = new Benchmark.Suite();
import { RedisClusterBatch } from './cluster';
import { batchFn } from './batchfn';

// add tests

const batchKv5000 = Object.fromEntries(
  Array.from({ length: 5000 }, (_, i) => {
    return [`key${i}`, `value${i}`];
  }),
);
const batchKeys5000 = Array.from(Object.keys(batchKv5000));

async function main() {
  const cluster = await RedisClusterBatch.getInstance();
  await cluster.mSetPx(
    {
      key1: 'value1',
    },
    70000,
  );
  const result = await cluster.mGet(['key1']);
  console.log('result', result);
  await cluster.client.set('key2', 'value2', {
    PX: 70000,
  });


  await cluster.client.zAdd(
    'zset1',
    Array.from({ length: 5000 }, (_, i) => {
      return {
        value: `key${i}`,
        score: i,
      };
    }),
  );

  await cluster.mSetPx(batchKv5000, 200000);
  let mGetCost = 0;
  let getCost = 0;
  const bln = 40;
  await batchFn(
    Array.from({ length: bln }, (v, k) => {
      return async () => {
        const tStart = Date.now();
        await cluster.mGet(batchKeys5000);
        mGetCost += Date.now() - tStart;
      };
    }),
    10,
  );
  console.log('mGetCost', Math.floor(mGetCost / bln));
  await batchFn(
    Array.from({ length: bln }, (v, k) => {
      return async () => {
        const tStart = Date.now();
        await Promise.all(
          batchKeys5000.map((key) => {
            return cluster.client.get(key);
          }),
        );
        getCost += Date.now() - tStart;
      };
    }),
    10,
  );
  console.log('getCost', Math.floor(getCost / bln));
}
main().catch(console.error);

// logs:
// => RegExp#test x 4,161,532 +-0.99% (59 cycles)
// => String#indexOf x 6,139,623 +-1.00% (131 cycles)
// => Fastest is String#indexOf
