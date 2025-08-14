import { Global, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Producer, Kafka, RecordMetadata, ProducerRecord, ProducerBatch } from 'kafkajs';
import { AvroSchemaRegistry } from '../registry/schema-registry';
import { DumpConfig } from '../config.dto';

@Global()
@Injectable()
export class KProducer implements OnModuleInit, OnApplicationShutdown {
  private producer: Producer;

  public constructor(
    public readonly kafka: Kafka,
    public readonly registry: AvroSchemaRegistry,
    private readonly config: DumpConfig,
  ) {
    this.producer = this.kafka.producer(this.config.producerConfig);
  }

  public async onModuleInit() {
    console.log(`KafkaProducerInitDisabled:${this.config.disabled}`);
    if (this.config.disabled) return;
    await this.producer.connect();
  }

  public async onApplicationShutdown(signal?: string) {
    if (this.config.disabled) return;
    await this.producer.disconnect();
  }

  public async send(record: ProducerRecord): Promise<RecordMetadata[]> {
    if (this.config.disabled) return [];
    return this.producer.send(record);
  }
  public async sendBatch(batch: ProducerBatch): Promise<RecordMetadata[]> {
    if (this.config.disabled) return [];
    return this.producer.sendBatch(batch);
  }
}
