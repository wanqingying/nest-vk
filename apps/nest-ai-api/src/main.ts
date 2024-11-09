import { NestFactory } from '@nestjs/core';
import { NestAiApiModule } from './nest-ai-api.module';

async function bootstrap() {
  const port2 = process.env.port;
  const app = await NestFactory.create(NestAiApiModule);
  // await app.listen(process.env.port ?? 3004);
  // const idNames= getIdAndNameList(1000000)

  await app.listen(port2 ?? 3004);
}

bootstrap();
