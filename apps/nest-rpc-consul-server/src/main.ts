import { NestFactory } from '@nestjs/core';
import { NestRpcConsulServerModule } from './nest-rpc-consul-server.module';

async function bootstrap() {
  const app = await NestFactory.create(NestRpcConsulServerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
