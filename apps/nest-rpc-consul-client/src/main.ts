import { NestFactory } from '@nestjs/core';
import { NestRpcConsulClientModule } from './nest-rpc-consul-client.module';

async function bootstrap() {
  const app = await NestFactory.create(NestRpcConsulClientModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
