// import './instrument';
import dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsulClient } from '@libs/microrpc/modules/consul/client';
import { ConsulGRPCIPV4Resolver } from '@libs/microrpc/modules/grpc/consul-grpc-resolver';
ConsulGRPCIPV4Resolver.setup();

console.log('process env' ,process.env.NODE_ENV);
const port= process.env.PORT || 3000;

async function bootstrap() {
  // todo init consul service client
  await ConsulClient.getServiceClient('nest-grpc-server').waitReady();
  const app = await NestFactory.create(AppModule);
  await app.listen(port).then(()=>{
    console.log(`app listen on ${port} port`);
  })
}
bootstrap();
