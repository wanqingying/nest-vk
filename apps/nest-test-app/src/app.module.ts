import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthModule } from './api/health/health.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpTraceInterceptor } from '@libs/shared/interceptors/trace.interceptor';

console.log('MongoDB connection string: mongodb://user:pass@');

@Module({
  imports: [
    HealthModule,
    MongooseModule.forRoot('mongodb://mongo2:27017', {
      onConnectionCreate: (conn) => {
        console.log('Mongo Connection created');
      },
      dbName: 'nest',
      user: 'user',
      pass: 'pass',
    }),
  ],
  controllers: [],
  providers: [
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: HttpTraceInterceptor,
    // },
  ],
})
export class NestTestAppModule {}
