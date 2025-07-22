import { Kafka } from 'kafkajs';
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';

async function main() {
  // const kafka_st = 'kafka.kafka.svc.cluster.local:9092'; // staging env
  const kafka_dev = 'kafka:29092'; // local docker env
  // const kafka_local = 'localhost:9092';
  const registry_dev = 'http://schema-registry:8081'; // local docker env
  // const registry_local = 'http://localhost:8082';
  // const registry_st = 'http://kafka-connect-schema-registry.kafka-connect:8081';

  // init registry and kafka
  const registry = new SchemaRegistry({ host: registry_dev });
  const kafka = new Kafka({
    brokers: [kafka_dev],
    clientId: 'example-consumer',
  });

  const topic = 'test.event.1';

  const schema = `
	{
	  "type": "record",
	  "name": "TestExampleObj",
	  "namespace": "examples",
	  "fields": [{ "type": "string", "name": "fullName" },{ "type": "string", "name": "userName" }]
	}
  `;
  const { id } = await registry.register(
    { type: SchemaType.AVRO, schema },
    {
      subject: topic + '-value',
    },
  );

  async function sendTestMsg() {
    const producer = kafka.producer();
    await producer.connect();
    const test_msg = {
      fullName: 'vvx',
      userName: 'user_name_22',
    };
    const encoded_msg = await registry.encode(id, test_msg);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('send message to topic ', topic);
    await producer.send({
      topic: topic,
      messages: [
        {
          key: 'user_id_123',
          value: encoded_msg,
        },
      ],
    });
  }

  async function startConsumer() {
    const consumer = kafka.consumer({ groupId: 'test-group' });
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

main();
