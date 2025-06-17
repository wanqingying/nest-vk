import Benchmark, { Deferred, Event } from 'benchmark';
var suite = new Benchmark.Suite();
import { RedisClusterBatch } from './cluster';

function getkv(len: number = 5000) {
  return Object.fromEntries(
    Array.from({ length: len }, (_, i) => {
      const random = Math.random().toString(36).slice(2);
      return [`key${i}${random}`, `value${i}`];
    }),
  );
}

const batchKv5000 = getkv();

const kv = batchKv5000;
const keys = Array.from(Object.keys(kv));

const suite1 = new Benchmark.Suite('ClusterClient');
const suite2 = new Benchmark.Suite('ClusterClientBatch');

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

  // await cluster.mSetPx(kv, 200000);
  // await Promise.all(
  //   Object.keys(batchKv5000).map(async (key) => {
  //     return cluster.client.set(key, batchKv5000[key], {
  //       PX: 200000,
  //     });
  //   }),
  // );

  async function runSuite(s: Benchmark.Suite) {
    return new Promise<void>((resolve) => {
      s.on('complete', function () {
        resolve();
      }).run({ async: true });
    });
  }

  suite1
    .add('ClusterSetWithTTLPipeline', {
      fn: async function (deferred: Deferred) {
        await cluster.pipe(keys, (p, keys, hashKeys) => {
          keys.forEach((k, i) => {
            p.set(hashKeys[i], kv[k], {
              PX: 60000,
            });
          });
        });
        deferred.resolve();
      },
      defer: true,
      minSamples: 500,
      maxTime: 8,
    })
    .on('cycle', function (event: Event) {
      console.log(String(event.target));
    });
  suite2
    .add('ClusterSetWithTTLWithLua', {
      fn: async function (deferred: Deferred) {
        await cluster.mSetPx(kv, 60000);
        deferred.resolve();
      },
      defer: true,
      minSamples: 500,
      maxTime: 8,
    })
    .on('cycle', function (event: Event) {
      console.log(String(event.target));
    });

  await runSuite(suite1);
  await runSuite(suite2);
}
main().catch(console.error);

// logs:
// => RegExp#test x 4,161,532 +-0.99% (59 cycles)
// => String#indexOf x 6,139,623 +-1.00% (131 cycles)
// => Fastest is String#indexOf
