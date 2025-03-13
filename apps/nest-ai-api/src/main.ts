import Consul from 'consul';
import { NestFactory } from '@nestjs/core';
import { NestAiApiModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import path from 'node:path';

const HOSTNAME = process.env.HOSTNAME ?? 'localhost';
const NODE_ENV = process.env.NODE_ENV;
const PROTO_DIR = path.join(process.cwd(), process.env.PROTO_DIR);
console.log('process.cwd()', process.cwd());
console.log('HOSTNAME', process.env.HOSTNAME);
console.log('HOST IP ', process.env.IP);
console.log('NODE_ENV', NODE_ENV);
console.log('PROTO_DIR', PROTO_DIR);

async function bootstrap() {
  const PORT_HTTP = Number(process.env.port ?? 3004);
  const PORT_RPC = PORT_HTTP + 1;
  const PORT_GRPC = PORT_HTTP + 2;
  const app = await NestFactory.create(NestAiApiModule);
  // const microserviceTCP = app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.TCP,
  //   options: {
  //     host: HOSTNAME,
  //     port: PORT_RPC,
  //   },
  // });
  const microserviceGRPC = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: `${HOSTNAME}:${PORT_GRPC}`,
      package: ['hero'],
      protoPath: [
        // hero
        path.join(PROTO_DIR, 'hero.proto'),
      ],
    },
  });
  await app.startAllMicroservices();

  await app
    .listen(PORT_HTTP)
    .then(async (res) => {
      console.log('app listen on ', PORT_HTTP);

      // 注册服务到Consul
      const consulClient = new Consul({
        // host:'consul',
        host: process.env.NODE_ENV === 'dev' ? 'localhost' : 'consul',
        port: 8500,
      });
      const serviceId = `nest-ai-api-${HOSTNAME}`;
      const sName = 'nest-ai-api-tcp';
      const gName = 'nest-ai-api-grpc';
      // await consulClient.agent.service.register({
      //   name: sName,
      //   id: `${sName}-${HOSTNAME}`,
      //   address: HOSTNAME,
      //   port: PORT_RPC,
      //   check: {
      //     http: `http://${HOSTNAME}:${PORT_HTTP}/health`,
      //     interval: '15s',
      //     timeout: '3s',
      //     name: `http-check-${sName}-${HOSTNAME}`,
      //   },
      // });
      await consulClient.agent.service.register({
        name: gName,
        id: `${gName}-${HOSTNAME}`,
        address: HOSTNAME,
        port: PORT_GRPC,
        check: {
          http: `http://${HOSTNAME}:${PORT_HTTP}/health`,
          interval: '15s',
          timeout: '3s',
          name: `http-check-${gName}-${HOSTNAME}`,
        },
      });
    })
    .catch(console.error);
}

bootstrap();
