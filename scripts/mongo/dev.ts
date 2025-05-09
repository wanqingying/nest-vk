import { MongoClient, ObjectId } from 'mongodb';
import util from 'node:util';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

const uri = 'mongodb://user:pass@mongo:27017/?maxPoolSize=2&w=majority';
console.log('starting mongo client');

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const client = new MongoClient(uri);
  console.log('connecting to mongo client');
  await client.connect();

  try {
    console.log('connected to mongo db');
    const database = client.db('nest');
    const movies = database.collection('movies');

    const manager = new MongoWatcherManager(client, {
      db: 'nest',
    });

    await manager.init();

    // establish a change stream
    const pipelines = [
      {
        $match: {
          operationType: { $in: ['insert', 'update', 'replace', 'delete'] },
        },
      },
    ];

    // const changeStream = movies.watch(pipelines, {
    //   fullDocument: 'updateLookup', //whenAvailable , required
    // });
    // changeStream.on('change', (next) => {
    //   try {
    //     const changeType = next.operationType;
    //     console.log('changeStream ', changeType, util.inspect(next));
    //   } catch (e) {
    //     console.error(e);
    //   }
    // });
    const bid = new ObjectId('67e50549699df3d42a0e83a7');
    const movie0 = await movies.findOne({
      _id: bid,
    });
    await wait(1000);
    await movies.updateOne(
      { _id: bid },
      {
        $set: {
          year: movie0.year + 2,
        },
      },
    );

    // Query for a movie that has the title 'Back to the Future'
    const query = { title: 'Back to the Future' };
    const movie = await movies.findOne({
      _id: new ObjectId('67e50549699df3d42a0e83a7'),
    });

    console.log(movie);
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

interface WatcherClientCol {
  clientId: string;
  dbName: string;
  observeName: string;
  updatedAt: Date;
}
interface WatcherClientConfigCol {
  dbName: string;
  observeName: string;
}

export interface WatchClientConfig {
  db?: string; // default to 'nest
}

export class MongoWatcherManager {
  private clients = new Map<string, MongoWatcherClient>();
  private mongo: MongoClient;
  private config: WatchClientConfig;
  private cName = 'watcher_clients';
  private gName = ['movies'];
  private dName: string;
  private locks: MongoLock;

  constructor(client: MongoClient, config: WatchClientConfig) {
    this.config = config;
    this.mongo = client;
    this.dName = config.db ?? 'nest';
  }

  private async getClients() {
    const collection = this.mongo
      .db(this.dName)
      .collection<WatcherClientCol>(this.cName);
    // find last 10s updated clients
    const clients = await collection
      .find({
        updatedAt: { $gt: new Date(Date.now() - 10000) },
      })
      .toArray();
    return clients;
  }

  public async init() {
    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await this.stop();
      process.exit(0);
    });
    process.on('beforeExit', async () => {
      await this.stop();
      process.exit(0);
    });
    const db = this.mongo.db(this.dName);
    await Promise.allSettled([db.createCollection(this.cName)]);
    const collectionClients = db.collection<WatcherClientCol>(this.cName);
    try {
      collectionClients.createIndex({ clientId: 1 }, { unique: true });
    } catch (e) {
      console.error(e);
    }
    this.locks = new MongoLock(this.mongo, this.dName);
    await this.locks.init();
    for (const name of this.gName) {
      await this.watchCollection(name);
    }
  }

  private async stop() {
    console.log('stopping mongo watcher');
    await Promise.allSettled(
      Array.from(this.clients.values()).map((t) => {
        return t.close();
      }),
    );
    await this.mongo.close();
  }

  private async watchCollection(collection: string) {
    const id = randomUUID();
    const lock = this.locks.acquireLock(collection, 30);
    if (!lock) {
      console.error('getLock failed');
      return;
    }

    try {
      const existingClient = await this.mongo
        .db(this.dName)
        .collection<WatcherClientCol>(this.cName)
        .findOne({
          observeName: collection,
          updatedAt: { $gt: new Date(Date.now() - 7000) },
        });

      if (existingClient?.clientId) {
        throw new Error(
          `Client ${existingClient.clientId} is already watching collection ${collection}`,
        );
      }
      if (this.clients.has(collection)) {
        this.clients.get(collection)?.close();
      }
      const watcher = new MongoWatcherClient(
        this.mongo,
        this.dName,
        collection,
        id,
      );
      await watcher.init();
      this.clients.set(collection, watcher);
    } catch (e) {
      console.error(e);
    } finally {
      this.locks.releaseLock(collection);
    }
  }
}

export class MongoWatcherClient extends EventEmitter {
  private client: MongoClient;
  private clientId: string;
  private config: WatchClientConfig;
  private observeName: string;
  private dName: string;

  constructor(client: MongoClient, db: string, name: string, id: string) {
    super();
    this.client = client;
    this.observeName = name;
    this.clientId = id;
    this.dName = db;
  }
  private timer: any;
  private startPing() {
    if (!this.timer) {
      this.timer = setInterval(() => {
        this.ping();
      }, 5000);
    }
  }
  private async ping() {
    const collection = this.client
      .db(this.dName)
      .collection<WatcherClientCol>('watcher_clients');
    await collection.updateOne(
      {
        clientId: this.clientId,
      },
      {
        $set: {
          updatedAt: new Date(),
          clientId: this.clientId,
          observeName: this.observeName,
        },
      },
      {
        upsert: true,
      },
    );
  }

  public async init() {
    const db = this.client.db(this.dName);
    const collection = db.collection(this.observeName);

    const changeStream = collection.watch([], {
      fullDocument: 'updateLookup',
    });

    changeStream.on('change', (next) => {
      try {
        const changeType = next.operationType;
        console.log(
          'changeStream ',
          util.inspect(
            Object.assign({}, next, {
              clientId: this.clientId,
            }),
          ),
        );
        this.emit(changeType, next);
      } catch (e) {
        console.error(e);
      }
    });
    await this.ping();
    this.startPing();
  }

  public async close() {
    clearInterval(this.timer);
    await this.client
      .db(this.dName)
      .collection<WatcherClientCol>('watcher_clients')
      .deleteMany({
        observeName: this.observeName,
      });
  }
}

export class MongoLock {
  private client: MongoClient;
  private db: string;
  constructor(client: MongoClient, db: string) {
    this.client = client;
    this.db = db;
  }

  public async init() {
    const db = this.client.db(this.db);
    try {
      await db.createCollection('locks');
    } catch (e) {
      // ignore
    }
    const collection = db.collection('locks');
    await Promise.allSettled([
      collection.createIndex({ lockId: 1 }, { unique: true }),
      collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]);
  }

  public async acquireLock(lockId: string, timeout: number) {
    const db = this.client.db(this.db);
    const collection = db.collection('locks');
    try {
      const result = await collection.insertOne({
        lockId,
        expiresAt: new Date(Date.now() + timeout),
      });
      return result.acknowledged;
    } catch (e) {
      if (String(e.code) === '11000') {
        return false;
      } else {
        // throw e;
        console.error(e);
        return false;
      }
    }
  }

  public async releaseLock(lockId: string) {
    const db = this.client.db(this.db);
    const collection = db.collection('locks');
    await collection.deleteOne({ lockId });
  }
}

run().catch(console.dir);
