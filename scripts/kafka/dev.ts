import 'reflect-metadata';
// import { KafkaManager } from './kafka';
import { AvroSchemaRegistry } from './feature-dump/registry/schema-registry';
import { userTestEvent1,test_topic_1 } from './feature-dump/test/avro.test';
import { Kafka, Producer } from 'kafkajs';
import { p13nSampleInstance } from './feature-dump/test/avro.sample.test';
import {dumpTestInstance1,DUMP_TOPIC,dumpTestInstance3} from "./dump.dto"

async function main3() {
  const kafka_dev = 'kafka:29092'; // local docker env
  const registry_dev = 'http://schema-registry:8081'; // local

  const kafka = new Kafka({
    brokers: [kafka_dev],
  });
  const registry = new AvroSchemaRegistry({
    schemaRegistryHost: registry_dev,
  } as any);
  const producer = kafka.producer();
  const consumer = kafka.consumer({ groupId: 'test2-group-1' });
  await producer.connect();
  await consumer.connect();
  async function start(topic: string) {
    async function sendTestMsg(data: any) {
      const encoded = await registry.encode(data);
      // await producer.send(topic, [
      //   {
      //     key: 'user_id2_123',
      //     value: encoded,
      //   }
      // ]);
      await producer.send({
        topic: topic,
        messages: [
          {
            key: 'user_id2_123',
            value: encoded,
          },
        ],
      });
    }

    async function startConsumer() {
      await consumer.subscribe({
        topic: topic,
      });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const decoded = await registry.decode(message.value as Buffer);
          console.log(
            'Received message from topic:' + topic,
            topic,
            partition,
            decoded,
          );
        },
      });
    }

    await startConsumer();
    return sendTestMsg;
  }

  // const sender1 = await start('test.sample.1');
  const sender2 = await start(DUMP_TOPIC);

  // await sender1(p13nSampleInstance);
  await sender2(dumpTestInstance3);
}

main3();
