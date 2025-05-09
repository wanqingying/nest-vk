import Redis from 'ioredis';

async function main() {
  const cluster = new Redis.Cluster([
    {
      port: 6378,
      host: '127.0.0.1',
    },
  ]);
  cluster.on('error', async (err) => {
    console.log('Redis Client Error', err);
  });
  cluster.on('connect', () => {
    console.log('redis connected');
  });
  //   await cluster.connect();
  console.log('cluster do foo');
  //   await cluster.set('foo', 'bar');
  //   cluster.get('foo', (err, res) => {
  //     console.log('err', err);
  //     console.log('res', res);
  //     // res === 'bar'
  //   });
}
main().catch(console.error);
