import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { AppService } from '@nestjs-ai-kit/app.service';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConsulSingletonClient } from '@app/microrpc/consul/client';
import { HealthModule } from './api/health/health.module';
import path from 'node:path';

// 'nest-ai-api-db9ae3384a91': {
//   ID: 'nest-ai-api-db9ae3384a91',
//   Service: 'nest-ai-api',
//   Tags: [],
//   Meta: {},
//   Port: 3004,
//   Address: 'db9ae3384a91',
//   Weights: { Passing: 1, Warning: 1 },
//   EnableTagOverride: false,
//   Datacenter: 'dc1'
// },

interface ConsulService {
  ID: string;
  Service: string;
  Tags: string[];
  Meta: Record<string, unknown>;
  Port: number;
  Address: string;
  Weights: Record<string, number>;
  EnableTagOverride: boolean;
  Datacenter: string;
}
const PROTO_DIR = path.join(process.cwd(), process.env.PROTO_DIR);

@Module({
  imports: [
    ClientsModule.registerAsync({
      isGlobal: true,
      clients: [
        {
          name: 'GRPC_HERO',
          useFactory: async () => {
            const targets: ConsulService[] =
              ConsulSingletonClient.getInstance().getServiceList(
                'nest-ai-api-grpc',
              );
            const urls = targets.map(
              (target) => `${target.Address}:${target.Port}`,
            );
            const port = targets[0].Port;
            return {
              transport: Transport.GRPC,
              options: {
                // url: urls[0],
                url: `dns:172.20.0.2:${port}`,
                package: ['hero'],
                protoPath: [
                  // hero
                  path.join(PROTO_DIR, 'hero.proto'),
                ],
                channelOptions:{
                  
                }
              },
            };
          },
        },
      ],
    }),
    // LangchainModule,
    // sentry
    SentryModule.forRoot(),
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
  exports: [],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {}
}
