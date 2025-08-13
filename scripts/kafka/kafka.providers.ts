import { Provider, Scope } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { KafkaNestModuleOptions } from './kafka.interfaces';

export const createKafkaProviders = (
  options: KafkaNestModuleOptions,
): Provider[] => {
  const kafka = new Kafka({
    brokers: options.brokers,
  });

  const providers: Provider[] = [];

  // Create producers
  if (options.producer?.length) {
    options.producer.forEach((config, index) => {
      const token = config.topic || config.token;
      providers.push({
        provide: token,
        scope: Scope.DEFAULT,
        useFactory: (): Producer => kafka.producer(config),
      });
    });
  }

  // Create consumers
  if (options.consumer?.length) {
    options.consumer.forEach((config, index) => {
      const token = config.topic || config.token;
      providers.push({
        provide: token,
        scope: Scope.DEFAULT,
        useFactory: (): Consumer => kafka.consumer(config),
      });
    });
  }

  return providers;
};
