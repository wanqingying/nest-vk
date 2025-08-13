import { Kafka, Producer, Consumer } from 'kafkajs';
import { Injectable } from '@nestjs/common';

/**
 * Kafka NestJS Module
 * 
 * 1. import
 * imports: [
 *   KafkaNestModule.forRoot({
 *     brokers: ['localhost:9092'],
 *     producer: [{ token: 'main' }],
 *     consumer: [{ groupId: 'my-group', token: 'main' }]
 *   })
 * ]
 *
 * 2. use producer/consumer
 * import { Kafka, Producer, Consumer } from 'kafkajs';
 * 
 * @KafkaProducer('main')
 * private producer: Producer;
 *
 * @KafkaConsumer('main')
 * private consumer: Consumer;
 *
 * Example usage:
 * 
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @KafkaProducer() private producer: Producer,
 *     @KafkaConsumer() private consumer: Consumer,
 *   ) {}
 * 
 *   async sendMessage(topic: string, message: any) {
 *     await this.producer.connect();
 *     await this.producer.send({
 *       topic,
 *       messages: [{ value: JSON.stringify(message) }],
 *     });
 *   }
 * 
 *   async consumeMessages(topic: string) {
 *     await this.consumer.connect();
 *     await this.consumer.subscribe({ topic });
 *     await this.consumer.run({
 *       eachMessage: async ({ message }) => {
 *         console.log(message.value?.toString());
 *       },
 *     });
 *   }
 * }
 */


