import { Module } from '@nestjs/common';
import { HealthModule } from './api/health/health.module';
import Bull from 'bull';
import { SayHelloWorker } from './worker/say-hello.worker';
import { Q_NNAME_1 } from '@libs/shared/src/bull.const';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullModule } from '@nestjs/bullmq';
import { ExpressAdapter } from '@bull-board/express';
// import { BullBoardModule } from "@bull-board/nestjs";
// import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
// import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    HealthModule,
    BullModule.forRoot({
      connection: {
        url: 'redis://localhost:6379',
        // other options
        // host: 'redis-dev',
        // port: 6379,
      },
      prefix: 'bull',
      settings: {},
    }),
    BullBoardModule.forRoot({
      route: '/board',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: Q_NNAME_1,
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    }),
  ],
  controllers: [],
  providers: [SayHelloWorker],
})
export class AppModule {}
