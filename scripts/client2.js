// ...existing code...
const path = require('path');

var PROTO_PATH = path.join(__dirname, '../libs/microrpc/src/protos/hero.proto');

console.log('PROTO_PATH', PROTO_PATH);
var parseArgs = require('minimist');
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const pkgs = grpc.loadPackageDefinition(packageDefinition);
// console.log('pkgs', pkgs);
var hello_proto = grpc.loadPackageDefinition(packageDefinition).hero;

function main() {
  var argv = parseArgs(process.argv.slice(2), {
    string: 'target',
  });

  var targets = ['localhost:3010', 'localhost:3011'];
  var client = new hello_proto.HeroesService(
    targets.join(','), // 将多个目标地址连接成一个字符串
    grpc.credentials.createInsecure(),
    {
      'grpc.lb_policy_name': 'round_robin', // 配置负载均衡策略
    },
  );

  client.findOne({ id: 1 }, function (err, response) {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Greeting:', response);
    }
  });
}

main();