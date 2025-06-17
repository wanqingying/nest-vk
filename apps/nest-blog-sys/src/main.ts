import { NestFactory } from '@nestjs/core';
import { NestAppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(NestAppModule);
  await app.listen(process.env.port ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
