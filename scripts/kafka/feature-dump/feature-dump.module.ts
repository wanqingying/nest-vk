import { DynamicModule, Global, Module, Scope } from '@nestjs/common';

import { AvroBaseDto, AvroField, AvroSchema, avtd } from './avro/avro.schema';
import { AvroSchemaRegistry } from './registry/schema-registry';
import { AsyncBatchQueue, BatchQueueConfig } from './queue/batch.queue';
import { Kafka } from 'kafkajs';
import { DumpConfig } from './config.dto';
import assert from 'node:assert';
import { KProducer } from './service/producer';

// todo add kafka dump producer service
@Global()
@Module({})
export class FeatureDumpModule {
  public static forRoot(config: Partial<DumpConfig>): DynamicModule {
    assert(config.brokers && config.brokers.length > 0, 'Brokers must be provided in DumpConfig');
    const kafkaInstance = new Kafka({
      clientId: config.clientId || 'feature-dump',
      brokers: config.brokers,
    });

    return {
      module: FeatureDumpModule,
      global: true,
      imports: [],
      controllers: [],
      providers: [
        {
          provide: DumpConfig,
          useFactory: () => {
            return Object.freeze(new DumpConfig(config));
          },
        },
        AvroSchemaRegistry,
        {
          provide: Kafka,
          useValue: kafkaInstance,
        },
        KProducer,
      ],
      exports: [KProducer, AvroSchemaRegistry, Kafka],
    };
  }
}

export { AvroSchemaRegistry, AvroBaseDto, AvroField, AvroSchema, AsyncBatchQueue, BatchQueueConfig, avtd, KProducer };
