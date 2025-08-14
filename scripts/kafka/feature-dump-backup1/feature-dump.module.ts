import { Global, Module, Scope } from '@nestjs/common';

import { AvroBaseDto, AvroField, AvroSchema } from './avro/avro.schema';
import { AvroSchemaRegistry } from './registry/schema-registry';
import { AsyncBatchQueue, BatchQueueConfig } from './queue/batch.queue';

// todo add kafka dump producer service
@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: AvroSchemaRegistry,
      scope: Scope.DEFAULT,
      useFactory: (): AvroSchemaRegistry => {
        return new AvroSchemaRegistry({});
      },
    },
  ],
})
export class FeatureDumpModule {}

export { AvroSchemaRegistry, AvroBaseDto, AvroField, AvroSchema, AsyncBatchQueue, BatchQueueConfig };
