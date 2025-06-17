import Consul from 'consul';
import { NestFactory } from '@nestjs/core';
import { NestAiApiModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import path from 'node:path';
import dotenv from 'dotenv';
import { getHostIp } from '@app/utils/getHostIp';
import { getNodeEnv, getServerNodeId } from '@app/utils';
dotenv.config();

const IP = getHostIp();
const NODE_ENV = process.env.NODE_ENV;
const PROTO_DIR = path.join(process.cwd(), process.env.PROTO_DIR);
console.log('process.cwd()', process.cwd());
console.log('HOSTNAME', process.env.HOSTNAME);
console.log('HOST IP ', process.env.IP);
console.log('NODE_ENV', NODE_ENV);
console.log('PROTO_DIR', PROTO_DIR);

const HOST_DK = 'host.docker.internal';
const HEALTH_HOST = NODE_ENV === 'dev' ? HOST_DK : IP;

async function bootstrap() {
  const PORT_HTTP = Number(process.env.PORT ?? 3004);
  const PORT_GRPC = PORT_HTTP + 2;
  process.env.PORT_GRPC = String(PORT_GRPC);
  const app = await NestFactory.create(NestAiApiModule);
  const microserviceGRPC = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: `localhost:${PORT_GRPC}`,
      package: ['hero'],
      protoPath: [
        // hero
        path.join(PROTO_DIR, 'hero.proto'),
      ],
    },
  });
  await app.startAllMicroservices();

  await app.listen(PORT_HTTP).then(async (res) => {
    console.log('app listen on ', PORT_HTTP);

    // registor Consul
    const consulClient = new Consul({
      // host:'consul',
      host: process.env.NODE_ENV === 'dev' ? 'localhost' : 'consul',
      port: 8500,
    });
    //todo unregister service when exit.
    const gName = 'nest-grpc-server';
    await consulClient.agent.service
      .register({
        name: gName,
        id: `${gName}-${getServerNodeId()}`,
        address: IP,
        port: PORT_GRPC,
        check: {
          http: `http://${HEALTH_HOST}:${PORT_HTTP}/health`,
          interval: '10s',
          timeout: '3s',
          name: `http-check-${gName}-${HEALTH_HOST}`,
        },
      })
      .then((res) => {
        console.log(`register grpc service on ${IP}:${PORT_GRPC} `);
        console.log(res);
      })
      .catch((err) => {
        console.error('register grpc service error');
        console.error(err);
      });
  });
}

bootstrap();
