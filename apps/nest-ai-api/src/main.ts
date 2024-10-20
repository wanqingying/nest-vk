import { NestFactory } from '@nestjs/core';
import { NestAiApiModule } from './nest-ai-api.module';

async function bootstrap() {
  const app = await NestFactory.create(NestAiApiModule);
  await app.listen(process.env.port ?? 3004);
}
bootstrap();
