import { ProducerConfig, ConsumerConfig } from 'kafkajs';

export interface KafkaNestModuleOptions {
  brokers: string[];
  producer?: ProducerConfig[];
  consumer?: ConsumerConfig[];
}

export interface KafkaNestModuleAsyncOptions {
  useFactory?: (...args: any[]) => Promise<KafkaNestModuleOptions> | KafkaNestModuleOptions;
  inject?: any[];
}
