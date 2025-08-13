import { Kafka } from 'kafkajs';
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import sampleAvro from './sample.avro.json';
import data2 from './data.json';
import { testSchemaData, userTestEvent1 } from './avro.test';

async function main2() {
  const kafka_dev = 'kafka:29092'; // local docker env
  const registry_dev = 'http://schema-registry:8081'; // local

  // init registry and kafka
  const registry = new SchemaRegistry({ host: registry_dev });
  const kafka = new Kafka({
    brokers: [kafka_dev],
    clientId: 'example-consumer',
  });

  const topic = 'test.event.5';

  const { id } = await registry.register(
    { type: SchemaType.AVRO, schema: JSON.stringify(testSchemaData) },
    {
      subject: topic + '-value',
    },
  );
  console.log('registered schema id:', id);

  async function sendTestMsg() {
    console.log('message sent start');

    const producer = kafka.producer();
    await producer.connect();
    const test_msg = userTestEvent1;
    console.log('test_msg:', test_msg);
    const encoded_msg = await registry.encode(id, test_msg);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('send message to topic ', topic);
    await producer.send({
      topic: topic,
      messages: [
        {
          key: 'user_id2_123',
          value: encoded_msg,
        },
      ],
    });
    console.log('message sent ok');
  }

  async function startConsumer() {
    const consumer = kafka.consumer({ groupId: 'test2-group' });
    await consumer.connect();
    await consumer.subscribe({ topic });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const decodedMessage = {
          ...message,
          value: await registry.decode(message.value as Buffer),
        };

        console.log(
          'Received message:',
          topic,
          partition,
          decodedMessage.value,
        );
      },
    });
  }

  await startConsumer();
  await sendTestMsg();
}

main2();
