import { Module, OnModuleDestroy } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthModule } from './api/health/health.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpTraceInterceptor } from '@libs/shared/interceptors/trace.interceptor';
import { RedisClusterModule } from '@libs/db';

console.log('MongoDB connection string: mongodb://user:pass@');

const host = 'ec2-44-243-110-192.us-west-2.compute.amazonaws.com';
@Module({
  imports: [
    HealthModule,
    RedisClusterModule.forRoot({
      nodes: [
        {
          host: host,
          port: 6380,
        },
      ],
      slotsRefreshInterval: 5000,
      tls: false,
      clusterOptions: {
        rootNodes: [{ url: `redis://${host}:6380` }],
        nodeAddressMap: (addr: string) => {
          const port = addr.split(':')[1];
          return {
            host,
            port: Number(port),
          };
        },
      },
    } as any),
    // MongooseModule.forRoot('mongodb://mongo2:27017', {
    //   onConnectionCreate: (conn) => {
    //     console.log('Mongo Connection created');
    //   },
    //   dbName: 'nest',
    //   user: 'user',
    //   pass: 'pass',
    // }),
  ],
  controllers: [],
  providers: [
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: HttpTraceInterceptor,
    // },
  ],
})
export class NestTestAppModule implements OnModuleDestroy {
  async onModuleDestroy() {
    console.log('app onModuleDestroy call');
  }
}
