import Benchmark, { Deferred, Event } from 'benchmark';
var suite = new Benchmark.Suite();
import { RedisClusterCmd } from './cluster';

// add tests

const batchKv5000 = Object.fromEntries(
  Array.from({ length: 5000 }, (_, i) => {
    return [`key${i}`, `value${i}`];
  }),
);
const batchKeys5000 = Array.from(Object.keys(batchKv5000));

async function main() {
  const cluster = await RedisClusterCmd.getInstance();
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

  await cluster.mSetPx(batchKv5000, 200000);
  await Promise.all(
    Object.keys(batchKv5000).map(async (key) => {
      return cluster.client.set(key, batchKv5000[key], {
        PX: 200000,
      });
    }),
  );

  suite
    // .add('ClusterMget', {
    //   fn: async function (deferred: Deferred) {
    //     await cluster.mGet(batchKeys5000);
    //     deferred.resolve();
    //   },
    //   defer: true,
    //   minSamples: 500,
    //   maxTime: 8,
    // })
    .add('ClusterClientGet', {
      fn: async function (deferred: Deferred) {
        await Promise.all(
          batchKeys5000.map(async (key) => {
            return cluster.client.get(key);
          }),
        );
        deferred.resolve();
      },
      defer: true,
      minSamples: 500,
      maxTime: 8,
    })

    // add listeners
    .on('cycle', function (event: Event) {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    // run async
    .run({ async: true });
}
main().catch(console.error);

// logs:
// => RegExp#test x 4,161,532 +-0.99% (59 cycles)
// => String#indexOf x 6,139,623 +-1.00% (131 cycles)
// => Fastest is String#indexOf
