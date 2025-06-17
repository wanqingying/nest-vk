import Benchmark, { Deferred, Event } from 'benchmark';
var suite = new Benchmark.Suite();
import { RedisClusterCmd } from './cluster';

// add tests

const batchKv5000 = Object.fromEntries(
  Array.from({ length: 5000 }, (_, i) => {
    return [`key${i}`, `value${i}`];
  }),
);

const batchKv20000 = Object.fromEntries(
  Array.from({ length: 20000 }, (_, i) => {
    return [`key${i}`, `value${i}`];
  }),
);

const kv = batchKv20000;
const keys = Array.from(Object.keys(kv));

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

  await cluster.mSetPx(kv, 200000);
  console.log(`mSetPx ${keys.length}kv done`);
  await Promise.all(
    keys.map(async (key) => {
      return cluster.client.set(key, kv[key], {
        PX: 200000,
      });
    }),
  );
  console.log(`client set ${keys.length}kv done`);

  const suit1 = new Benchmark.Suite('ClusterMget');
  const suit2 = new Benchmark.Suite('ClusterClientGet');

  async function runSuite(suit: Benchmark.Suite) {
    return new Promise<void>((resolve) => {
      suit
        .on('complete', () => {
          resolve();
        })
        .run({ async: true });
    });
  }

  suit1
    .add('ClusterClientGet1', {
      fn: async function (deferred: Deferred) {
        await Promise.all(
          keys.map(async (key) => {
            return cluster.client.get(key);
          }),
        );
        deferred.resolve();
      },
      defer: true,
      minSamples: 800,
      maxTime: 10,
    })
    .on('cycle', function (event: Event) {
      console.log(String(event.target));
    });

  suit2
    .add('ClusterMget', {
      fn: async function (deferred: Deferred) {
        await cluster.mGet(keys);
        deferred.resolve();
      },
      defer: true,
      minSamples: 800,
      maxTime: 10,
    })
    .on('cycle', function (event: Event) {
      console.log(String(event.target));
    });

  await runSuite(suit1);
  await runSuite(suit2);
}
main()
  .catch(console.error)
  .finally(() => {
    console.log('done');
    process.exit(0);
  });

// logs:
// => RegExp#test x 4,161,532 +-0.99% (59 cycles)
// => String#indexOf x 6,139,623 +-1.00% (131 cycles)
// => Fastest is String#indexOf
