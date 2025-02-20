import './instrument';
import { NestFactory } from '@nestjs/core';
import { NestAiApiModule } from './app.module';

// apiKey: 'sk-Jg800f045160f131efd4e26ddbcb0b7cd5d90b0028aT6CVy', // This is the default and can be omitted
// baseURL: 'https://api.gptsapi.net/v1',

// process.env.OPENAI_API_KEY = 'sk-Jg800f045160f131efd4e26ddbcb0b7cd5d90b0028aT6CVy';
// process.env.OPENAI_BASE_URL = 'https://api.gptsapi.net/v1';
console.log('process.env.OPENAI_API_KEY', process.env.OPENAI_API_KEY);

async function bootstrap() {
  const port2 = process.env.port ?? 3004;
  const app = await NestFactory.create(NestAiApiModule);

  await app
    .listen(port2)
    .then((res) => {
      console.log('app listen on ', port2);
    })
    .catch(console.error);
}

bootstrap();
