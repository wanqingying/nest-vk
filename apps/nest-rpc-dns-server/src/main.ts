import { NestFactory } from '@nestjs/core';
import { NestAiApiModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import path from 'node:path';
import dotenv from 'dotenv';
import { getHostIp } from '@libs/utils/src/getHostIp';
import { ServerCredentials } from '@grpc/grpc-js';
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
  const appGrpc = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: `0.0.0.0:${PORT_GRPC}`,
      package: ['hero'],
      credentials: ServerCredentials.createInsecure(),
      protoPath: [
        // hero
        path.join(PROTO_DIR, 'hero.proto'),
      ],
    },
  });
  await app.startAllMicroservices();

  await app.listen(PORT_HTTP).then(async (res) => {
    console.log(`app listen on http:${PORT_HTTP} and grpc:${PORT_GRPC}`);
  });
}

bootstrap();
