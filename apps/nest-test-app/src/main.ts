// const dotenv = require('dotenv');
// dotenv.config();

// import { NestFactory } from '@nestjs/core';
// import { NestTestAppModule } from './app.module';

// const port = process.env.port ?? 3007;
// async function bootstrap() {
//   const app = await NestFactory.create(NestTestAppModule);
//   await app.listen(port);
//   console.log(`Application is running on: ${await app.getUrl()}`);
// }
// bootstrap();

// --- http2

const dotenv = require('dotenv');
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { NestTestAppModule } from './app.module';
import * as http2 from 'http2';
import { setupGracefulShutdown } from '@libs/utils';

const port = process.env.port ?? 3007;
async function bootstrap() {
  // 创建 HTTP/2 服务器（无 TLS）
  const server = http2.createServer();

  // 使用自定义 HTTP/2 服务器创建 NestJS 应用
  const app = await NestFactory.create(NestTestAppModule, {
    httpsOptions: null,
    rawBody: true,
    // // 使用预先创建的 HTTP/2 服务器
    // adapter: {
    //   use: (...args) => server.on('request', args[0]),
    //   listen: (port, callback) => server.listen(port, callback),
    //   get: () => server,
    // },
  });
  const adapter = app.getHttpAdapter();
  app.setGlobalPrefix('api');

  await app.listen(port);
  // app.enableShutdownHooks();
  console.log(`Application is running on: ${await app.getUrl()} with HTTP/2`);
  setupGracefulShutdown(app, {
    timeoutMs: 9000,
    wait: 500,
  });
}
bootstrap();
