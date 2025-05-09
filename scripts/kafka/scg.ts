import { Kafka } from 'kafkajs';
import {
  SchemaRegistry,
  SchemaType,
  avdlToAVSCAsync,
} from '@kafkajs/confluent-schema-registry';

async function main() {
  const registry = new SchemaRegistry({ host: 'http://schema-registry:8081' });
  const kafka = new Kafka({
    brokers: ['kafka:29092'],
    clientId: 'example-consumer',
  });
  //   const consumer = kafka.consumer({ groupId: 'test-group' });
  const producer = kafka.producer();

  const incomingTopic = 'incoming';
  const outgoingTopic = 'outgoing';

  const run = async () => {
    // const schema = await avdlToAVSCAsync(path.join(__dirname, 'schema.avdl'));
    const schema = `
	{
	  "type": "record",
	  "name": "RandomTest",
	  "namespace": "examples",
	  "fields": [{ "type": "string", "name": "fullName" }]
	}
  `;

    // const exid = await registry.getLatestSchemaId('event.sample.1-value');
    // console.log('exid', exid);

    const { id } = await registry.register({ type: SchemaType.AVRO, schema });
    // registry.get

    // await consumer.connect();
    await producer.connect();
    const msg1 = {
      fullName: 'vvx',
    };
    const val = await registry.encode(id, msg1);
    const outgoingMessage = {
      key: 'keeey1',
      value: val,
    };
    // const val2 = await registry.encode(exid, {
    //   id: 799,
    // });
    await producer.send({
      topic: 'test.event.1',
      messages: [outgoingMessage],
    });
    // await producer.send({
    //   topic: 'event.sample.1',
    //   messages: [
    //     {
    //       key: new Date().toISOString(),
    //       value: val2,
    //     },
    //   ],
    // });

    // await consumer.subscribe({ topic: incomingTopic });

    // await consumer.run({
    //   eachMessage: async ({ topic, partition, message }) => {
    //     const decodedMessage = {
    //       ...message,
    //       value: await registry.decode(message.value as Buffer),
    //     };

    //     const outgoingMessage = {
    //       key: message.key,
    //       value: await registry.encode(id, decodedMessage.value),
    //     };

    //     await producer.send({
    //       topic: outgoingTopic,
    //       messages: [outgoingMessage],
    //     });
    //   },
    // });
  };
  return run();
}

main();
