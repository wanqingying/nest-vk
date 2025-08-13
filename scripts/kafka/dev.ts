import { KafkaManager } from './kafka';

async function main2() {
  const kafka_dev = 'kafka:29092'; // local docker env
  const registry_dev = 'http://schema-registry:8081'; // local

  const kafkaManager = new KafkaManager([kafka_dev], 'example-consumer', registry_dev);
  const producer = kafkaManager.getProducer();
  const consumer = kafkaManager.getConsumer('test2-group');

  const topic = 'test.sample.1';

  async function sendTestMsg() {
    await producer.sendMessage(topic, 'user_id2_123', sample2);
  }

  async function startConsumer() {
    await consumer.subscribe(topic);
    await consumer.startConsuming(async (topic, partition, key, value) => {
      console.log('Received message:', topic, partition, value);
    });
  }

  await startConsumer();
  await sendTestMsg();
}

async function main3() {
  const kafka_dev = 'kafka:29092'; // local docker env
  const registry_dev = 'http://schema-registry:8081'; // local

  const kafkaManager = new KafkaManager([kafka_dev], 'example-consumer', registry_dev);

  async function start(topic: string) {
    const producer = kafkaManager.getProducer();
    const consumer = kafkaManager.getConsumer('test2-group-' + topic);

    async function sendTestMsg(data: any) {
      await producer.sendMessage(topic, 'user_id2_123', data);
    }

    async function startConsumer() {
      await consumer.subscribe(topic);
      await consumer.startConsuming(async (topic, partition, key, value) => {
        console.log('Received message from topic:' + topic, topic, partition, value);
      });
    }

    await startConsumer();
    return sendTestMsg;
  }

  const sender1 = await start('test.sample.1');
  const sender2 = await start('test.event.5');

  await sender1(p13nSampleInstance);
  await sender2(userTestEvent1);
}

main3();
    await consumer.subscribe({ topic });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const decodedMessage = {
          ...message,
          value: await registry2.decode(message.value),
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

async function main3() {
  const kafka_dev = 'kafka:29092'; // local docker env
  const registry_dev = 'http://schema-registry:8081'; // local

  const registry2 = new AvroSchemaRegistry({
    host: registry_dev,
  });

  // init registry and kafka
  // const registry = new SchemaRegistry({ host: registry_dev });
  const kafka = new Kafka({
    brokers: [kafka_dev],
    clientId: 'example-consumer',
  });


  async function start(topic: string) {
    async function sendTestMsg(data: any) {
      console.log('message sent start');

      const producer = kafka.producer();
      await producer.connect();
      const encoded_msg = await registry2.encode(data);

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
      const consumer = kafka.consumer({ groupId: 'test2-group-' + topic });
      await consumer.connect();
      await consumer.subscribe({ topic });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const decodedMessage = {
            ...message,
            value: await registry2.decode(message.value),
          };

          console.log(
            'Received message from topic:' + topic,
            topic,
            partition,
            decodedMessage.value,
          );
        },
      });
    }

    await startConsumer();
    return sendTestMsg;
  }

  const sender1 = await start('test.sample.1');
  const sender2 = await start('test.event.5');

  await sender1(p13nSampleInstance);
  await sender2(userTestEvent1);
}

main3();
