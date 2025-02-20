import { Module } from '@nestjs/common';
import { ChatModule } from './api/chat/chat.module';

import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

// config
import { ConfigModule } from '@nestjs/config';
import { LangchainModule } from './modules/langchain.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ChatModule,
    LangchainModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class NestAiApiModule {}
