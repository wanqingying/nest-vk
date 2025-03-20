import { NestFactory } from '@nestjs/core';
import { NestTestAppModule } from './app.module';

const port =process.env.port ?? 3007
async function bootstrap() {
  const app = await NestFactory.create(NestTestAppModule);
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
