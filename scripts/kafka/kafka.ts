import { Kafka, Producer, Consumer } from 'kafkajs';

export class KafkaManager {
  private kafka: Kafka;

  constructor(brokers: string[], clientId: string) {
    this.kafka = new Kafka({
      brokers,
      clientId,
    });
  }

  getProducer(): KafkaProducer {
    return new KafkaProducer(this.kafka.producer());
  }

  getConsumer(groupId: string): KafkaConsumer {
    return new KafkaConsumer(this.kafka.consumer({ groupId }));
  }
}

export class KafkaProducer {
  private producer: Producer;
  private isConnected: boolean = false;

  constructor(producer: Producer) {
    this.producer = producer;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  async sendMessage(topic: string, key: string, value: Buffer | string): Promise<void> {
    await this.connect();
    
    console.log(`Sending message to topic: ${topic}`);
    await this.producer.send({
      topic,
      messages: [
        {
          key,
          value,
        },
      ],
    });
    console.log('Message sent successfully');
  }

  async sendMessages(topic: string, messages: Array<{ key: string; value: Buffer | string }>): Promise<void> {
    await this.connect();
    
    console.log(`Sending ${messages.length} messages to topic: ${topic}`);
    await this.producer.send({
      topic,
      messages,
    });
    console.log('Messages sent successfully');
  }
}

export class KafkaConsumer {
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(consumer: Consumer) {
    this.consumer = consumer;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
    }
  }

  async subscribe(topic: string): Promise<void> {
    await this.connect();
    await this.consumer.subscribe({ topic });
  }

  async subscribeToTopics(topics: string[]): Promise<void> {
    await this.connect();
    for (const topic of topics) {
      await this.consumer.subscribe({ topic });
    }
  }

  async startConsuming(
    messageHandler: (topic: string, partition: number, key: string | null, value: Buffer | null) => Promise<void>
  ): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const key = message.key ? message.key.toString() : null;
        
        console.log(`Received message from topic: ${topic}, partition: ${partition}`);
        await messageHandler(topic, partition, key, message.value);
      },
    });
  }

  async startConsumingWithRawHandler(
    messageHandler: (topic: string, partition: number, message: any) => Promise<void>
  ): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`Received message from topic: ${topic}, partition: ${partition}`);
        await messageHandler(topic, partition, message);
      },
    });
  }
}