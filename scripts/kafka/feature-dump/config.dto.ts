import { ProducerConfig } from 'kafkajs';

export class DumpConfig {
  public constructor(config: Partial<DumpConfig>) {
    Object.assign(this, config);
  }

  public brokers!: string[];
  public clientId!: string;
  public schemaRegistryHost!: string;

  public producerConfig?: ProducerConfig;
  public disabled!: boolean; // disable dump on local dev
}
