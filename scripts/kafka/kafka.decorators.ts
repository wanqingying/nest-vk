import { Inject } from '@nestjs/common';

export const KafkaProducer = (token: string = 'default') => 
  Inject(`KAFKA_PRODUCER_${token}`);

export const KafkaConsumer = (token: string = 'default') => 
  Inject(`KAFKA_CONSUMER_${token}`);
