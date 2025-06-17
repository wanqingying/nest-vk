// import './instrument';
import dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsulClient } from '@app/microrpc/modules/consul/client';
import { ConsulGRPCIPV4Resolver } from '@app/microrpc/modules/grpc/consul-grpc-resolver';
ConsulGRPCIPV4Resolver.setup();

console.log('process env', process.env.NODE_ENV);

async function bootstrap() {
  // todo init consul service client
  await ConsulClient.getServiceClient('nest-grpc-server').waitReady();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000).then(() => {
    console.log('app listen on 3000 port');
  });
}
bootstrap();
