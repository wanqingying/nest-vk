import path from 'path';
// process.env.GRPC_TRACE='all';
// process.env.GRPC_VERBOSITY='DEBUclG';
var PROTO_PATH = path.join(
  process.cwd(),
  '../libs/microrpc/src/protos/hero.proto',
);

import grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { IpV4Resolver } from './ipv4_resolver';
IpV4Resolver.setup();

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const pkgs = grpc.loadPackageDefinition(packageDefinition);
// console.log('pkgs', pkgs);
var hello_proto = grpc.loadPackageDefinition(packageDefinition).hero as any;

async function testClient(target) {
  console.log('test target :', target);
  const serviceConfig = {
    loadBalancingConfig: [{ round_robin: {} }],
  };
  var client = new hello_proto.HeroesService(
    target,
    grpc.credentials.createInsecure(),
    {
      // 'grpc.lb_policy_name': 'pick_first',
      'grpc.service_config': JSON.stringify(serviceConfig),
    },
  );
  // client.address=[]

  async function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async function findOne() {
    return new Promise((resolve) => {
      client.findOne({ id: 1 }, function (err, response) {
        if (err) {
          console.error('Error:', err);
        } else {
          console.log('response', ':', response);
        }
        resolve(1);
      });
    });
  }

  return new Promise(async (resolve) => {
    for (let i = 0; i < 90; i++) {
      await findOne();
      await wait(1000);
    }
    resolve(1);
  });
}


async function main() {
  const target2 = 'ipv4:127.0.0.1:3010';
  // await testClient(target1).catch(console.error);
  await testClient(target2).catch(console.error);
}

main();
