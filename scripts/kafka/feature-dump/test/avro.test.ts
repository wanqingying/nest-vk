import 'reflect-metadata';
import { isEqual } from 'lodash';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { inspect } from 'node:util';

import { AvroField, AvroSchema, AvroBaseDto, avtd } from '../avro/avro.schema';

// ========== example usage ==========

@AvroSchema({
  namespace: 'com.flip.personalization',
  name: 'EventTag',
})
export class EventTag extends AvroBaseDto {
  @AvroField({ type: avtd.types.string })
  public name!: string;

  @AvroField({ type: avtd.types.string })
  public value!: string;

  public constructor(data?: Partial<EventTag>) {
    super(data);
    Object.assign(this, data);
  }
}

@AvroSchema({
  namespace: 'com.flip.personalization',
  name: 'EventMetadata',
})
export class EventMetadata extends AvroBaseDto {
  @AvroField({ type: avtd.types.string })
  public source!: string;

  @AvroField({
    type: avtd.types.string,
    optional: true,
  })
  public campaign?: string;

  public constructor(data?: Partial<EventMetadata>) {
    super(data);
    Object.assign(this, data);
  }
}

export const test_topic_1 = 'test.event.5';

@AvroSchema({
  namespace: 'flip.p13n',
  name: 'UserTestEvent',
  doc: 'Test event for user interactions',
  topic: test_topic_1,
})
export class UserTestEvent extends AvroBaseDto {
  @AvroField({ type: avtd.types.string })
  public userId!: string;

  @AvroField({
    type: avtd.types.long,
  })
  public timestamp!: number;

  @AvroField({
    type: avtd.types.int,
    optional: true,
    default: 1,
  })
  public age?: number;

  @AvroField({
    type: EventMetadata,
    optional: true,
    default: null,
  })
  public metadata?: EventMetadata;

  @AvroField({
    type: avtd.types.array,
    items: avtd.types.string,
  })
  public tags!: string[];

  @AvroField({
    type: avtd.types.array,
    items: EventTag,
  })
  public eventTags!: EventTag[];

  public constructor(data: Partial<UserTestEvent>) {
    console.log('data', data);
    super(data);
    Object.assign(this, data);
  }
}

export const userTestEvent1 = new UserTestEvent({
  userId: 'user123',
  timestamp: Date.now(),
  metadata: new EventMetadata({
    source: 'test_source',
    campaign: 'test_campaign',
  }),
  tags: ['tag1', 'tag2'],
  eventTags: [new EventTag({ name: 'tag1', value: 'value1' })],
});

export const testSchemaData = userTestEvent1.getSchema();
console.log('userTestEvent1', inspect(userTestEvent1));

async function testSchemaIsEq(): Promise<void> {
  const fName = 'test-schema6.json';
  const fileName = path.join(__dirname, fName);
  try {
    if (!fs.existsSync(fileName)) {
      fs.writeFileSync(fileName, JSON.stringify(testSchemaData, null, 2));
    } else {
      const data = (await import(fileName)).default;
      assert.deepStrictEqual(data, testSchemaData);

      const isEq = isEqual(data, testSchemaData);
      console.log('Schema equality:', isEq);
    }
  } catch (error) {
    console.error('Schema comparison failed:', error);
    throw error;
  }
}

testSchemaIsEq().catch(console.error);
