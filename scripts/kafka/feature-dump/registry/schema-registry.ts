import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import assert from 'node:assert';

import { AvroBaseDto, Constructor, getSchemaConfig } from '../avro/avro.schema';
import { DumpConfig } from '../config.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AvroSchemaRegistry {
  private registry!: SchemaRegistry;
  private schemaIds: Map<Constructor, number> = new Map();

  public constructor(private config: DumpConfig) {
    const host = config.schemaRegistryHost || process.env.SCHEMA_REGISTRY_URL;
    this.registry = new SchemaRegistry({
      host: host ?? 'http://kafka-connect-schema-registry.kafka-connect:8081',
    });
  }

  public async getSchemaId(dto: AvroBaseDto): Promise<number> {
    const constructor = dto.constructor as Constructor;
    if (!this.schemaIds.has(constructor)) {
      const schema = dto.getSchema();
      const config = getSchemaConfig(constructor);
      assert(config.topic, 'AvroSchemaConfig.topic is required ');
      const res = await this.registry.register(
        {
          type: SchemaType.AVRO,
          schema: JSON.stringify(schema),
        },
        {
          subject: `${config.topic}-value`,
        },
      );
      this.schemaIds.set(constructor, res.id);
    }
    return this.schemaIds.get(constructor)!;
  }

  public async encode<T extends AvroBaseDto>(dto: T): Promise<Buffer> {
    const schemaId = await this.getSchemaId(dto);
    return this.registry.encode(schemaId, dto);
  }

  public async decode<T extends AvroBaseDto>(buffer: Buffer): Promise<T> {
    return this.registry.decode(buffer);
  }
}
