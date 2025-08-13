import { DynamicModule, Module } from '@nestjs/common';
import {
  KafkaNestModuleOptions,
  KafkaNestModuleAsyncOptions,
} from './kafka.interfaces';
import { createKafkaProviders } from './kafka.providers';

@Module({})
export class KafkaNestModule {
  static forRoot(options: KafkaNestModuleOptions): DynamicModule {
    const providers = createKafkaProviders(options);

    return {
      module: KafkaNestModule,
      providers,
      exports: providers,
      global: true,
    };
  }

  static forRootAsync(options: KafkaNestModuleAsyncOptions): DynamicModule {
    return {
      module: KafkaNestModule,
      providers: [
        {
          provide: 'KAFKA_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: 'KAFKA_PROVIDERS',
          useFactory: (kafkaOptions: KafkaNestModuleOptions) => {
            return createKafkaProviders(kafkaOptions);
          },
          inject: ['KAFKA_OPTIONS'],
        },
      ],
      exports: ['KAFKA_PROVIDERS'],
      global: true,
    };
  }
}
