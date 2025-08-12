import { MemoryCacheModule } from '@flip/cache';
import { LoggerService } from '@flip/intelligence';
import { JournalModule } from '@flip/journal';
import { Global, Module, DynamicModule } from '@nestjs/common';

import { SampleConfig, StorePostInfo, UpdatePostInfo } from './collector.const';
import { CollectorService } from './collector.service';

/**
 *
 * this collector is use to collect sample data, like a logger

 */
@Global()
@Module({})
export class SampleCollectorModule {
  public static forRoot(config: SampleConfig): DynamicModule {
    return {
      module: SampleCollectorModule,
      imports: [
        MemoryCacheModule,
        JournalModule.forRoot({
          microservice: config.serviceName,
          disableForLocalRun: config.disableForLocalRun,
          config: {
            producer: true,
            client: {
              brokers: config.brokers,
            },
          },
        }),
      ],
      providers: [
        CollectorService,
        {
          provide: SampleConfig,
          useValue: new SampleConfig(config),
        },
        {
          provide: LoggerService,
          useValue: new LoggerService('SampleCollectorModule'),
        },
      ],
      exports: [CollectorService],
    };
  }
}

export { CollectorService, StorePostInfo, UpdatePostInfo };
