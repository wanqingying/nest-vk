// import './instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsulSingletonClient } from '@app/microrpc/consul/client';
console.log('process env');
console.log(JSON.stringify(process.env, null, 2));

async function bootstrap() {
  await ConsulSingletonClient.getInstance().initServices();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
