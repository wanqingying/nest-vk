import 'reflect-metadata';
import assert from 'node:assert';
import { isEqual } from 'lodash';
import { Type, schema } from 'avsc';
import { inspect } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { AvroField, AvroSchema, AvroBaseDto, avtd } from './avro.schema';

// ========== example usage ==========

@AvroSchema({
  namespace: 'com.flip.personalization',
  name: 'EventTag',
})
export class EventTag extends AvroBaseDto {
  @AvroField({ type: avtd.types.string })
  name: string;

  @AvroField({ type: avtd.types.string })
  value: string;

  constructor(data?: Partial<EventTag>) {
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
  source: string;

  @AvroField({
    type: avtd.types.string,
    optional: true,
  })
  campaign?: string;

  constructor(data?: Partial<EventMetadata>) {
    super(data);
    Object.assign(this, data);
  }
}

@AvroSchema({
  namespace: 'flip.p13n',
  name: 'UserTestEvent',
  doc: 'Test event for user interactions',
})
export class UserTestEvent extends AvroBaseDto {
  @AvroField({ type: avtd.types.string })
  userId: string;

  @AvroField({
    type: avtd.types.long,
  })
  timestamp: number;

  @AvroField({
    type: avtd.types.int,
    optional: true,
    default: 1,
  })
  age?: number;

  @AvroField({
    type: EventMetadata,
    optional: true,
    default: null,
  })
  metadata?: EventMetadata;

  @AvroField({
    type: avtd.types.array,
    items: avtd.types.string,
  })
  tags: string[];

  @AvroField({
    type: avtd.types.array,
    items: EventTag,
  })
  eventTags: EventTag[];

  constructor(data: Partial<UserTestEvent>) {
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
