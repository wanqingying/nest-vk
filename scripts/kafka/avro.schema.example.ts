import 'reflect-metadata';
import assert from 'node:assert';
import { isEqual } from 'lodash';

// 常量定义
const METADATA_KEYS = {
  SCHEMA: 'avro:schema',
  FIELDS: 'avro:fields',
} as const;

const AVRO_TYPES = {
  RECORD: 'record',
  ARRAY: 'array',
  ENUM: 'enum',
  STRING: 'string',
  LONG: 'long',
  NULL: 'null',
} as const;

// 优化后的类型定义
interface AvroSchemaOptions {
  readonly namespace?: string;
  readonly name?: string;
  readonly doc?: string;
}

enum AvroPrimitiveType {
  string = 'string',
  long = 'long',
  null = 'null',
  array = 'array',
  enum = 'enum',
  record = 'record',
  union = 'union',
  logicalType = 'logicalType',
}
// type AvroFieldOption = AvroPrimitiveType | AvroBase;

interface FieldPrimitiveOption {
  readonly type?: AvroFieldType;
  // readonly logicalType?: string;
  readonly default?: unknown;
  readonly doc?: string;
  readonly optional?: boolean;
  // readonly items?: AvroPrimitiveType | AvroBase;
  // readonly symbols?: readonly string[];
}

interface FieldArrayType extends FieldPrimitiveOption {
  readonly type: AvroPrimitiveType.array;
  readonly items: AvroFieldType;
}

interface FieldEnumType extends FieldPrimitiveOption {
  readonly type: AvroPrimitiveType.enum;
  readonly name: string;
  readonly symbols: readonly string[];
}

interface FieldUnionType extends ReadonlyArray<AvroFieldType> {}
interface FieldLogicalType extends FieldPrimitiveOption {
  readonly type: AvroPrimitiveType.logicalType;
  readonly logicalType: string;
}


type Constructor = new (...args: any[]) => any;

// 定义具体的 Avro 类型
type AvroFieldType =
  | AvroPrimitiveType
  | AvroSchema
  | AvroArrayType
  | AvroEnumType
  | AvroUnionType
  | AvroLogicalType
  | AvroBase;

type AvroFieldOption =  

FieldPrimitiveOption| FieldArrayType | FieldEnumType | FieldUnionType | FieldLogicalType;

// type AvroFieldOption = AvroFieldType & FieldOptionBase;
// let b:AvroFieldOption=null as any;
// b.

interface AvroArrayType {
  readonly type: AvroPrimitiveType.array;
  readonly items: AvroFieldType;
}

interface AvroEnumType {
  readonly type: AvroPrimitiveType.enum;
  readonly name: string;
  readonly symbols: readonly string[];
}

interface AvroUnionType extends ReadonlyArray<AvroFieldType> {}

interface AvroLogicalType {
  readonly type: AvroPrimitiveType.logicalType;
  readonly logicalType: string;
}

interface AvroField {
  readonly name: string;
  readonly type: AvroFieldType;
  readonly default?: unknown;
  readonly doc?: string;
}

interface AvroSchema {
  readonly type: AvroPrimitiveType.record;
  readonly name: string;
  readonly namespace?: string;
  readonly fields: readonly AvroField[];
  readonly doc?: string;
}

// Schema 装饰器
export function AvroSchema(options: AvroSchemaOptions) {
  return function <T extends Constructor>(constructor: T): T {
    Reflect.defineMetadata(METADATA_KEYS.SCHEMA, options, constructor);
    return constructor;
  };
}

// 字段装饰器
export function AvroField(options: AvroFieldOption) {
  return function (target: any, propertyKey: string): void {
    const existingFields =
      Reflect.getMetadata(METADATA_KEYS.FIELDS, target.constructor) || {};
    const newFields = { ...existingFields, [propertyKey]: options };
    Reflect.defineMetadata(METADATA_KEYS.FIELDS, newFields, target.constructor);
  };
}

// Schema 生成器
export class AvroSchemaGenerator {
  private static readonly enumNameCounter = new Map<string, number>();

  static generateSchema(constructor: Constructor): AvroSchema {
    const schemaOptions = this.getSchemaOptions(constructor);
    const fieldOptions = this.getFieldOptions(constructor);

    const fields = Object.entries(fieldOptions).map(([fieldName, options]) =>
      this.createField(fieldName, options),
    );

    return {
      type: AvroPrimitiveType.record,
      name: schemaOptions.name || constructor.name,
      ...(schemaOptions.namespace && { namespace: schemaOptions.namespace }),
      fields,
      ...(schemaOptions.doc && { doc: schemaOptions.doc }),
    };
  }

  private static getSchemaOptions(constructor: Constructor): AvroSchemaOptions {
    const options = Reflect.getMetadata(METADATA_KEYS.SCHEMA, constructor);
    if (!options) {
      throw new Error(
        `Missing @AvroSchema decorator on class ${constructor.name}. ` +
          'Please add @AvroSchema decorator with appropriate options.',
      );
    }
    return options;
  }

  private static getFieldOptions(
    constructor: Constructor,
  ): Record<string, AvroFieldOption> {
    return Reflect.getMetadata(METADATA_KEYS.FIELDS, constructor) || {};
  }

  private static createField(
    fieldName: string,
    options: AvroFieldOption,
  ): AvroField {
    const field: AvroField = {
      name: fieldName,
      type: this.resolveAvroType(options),
    };

    if (options.default !== undefined) {
      (field as any).default = options.default;
    }
    if (options.doc) {
      (field as any).doc = options.doc;
    }

    return field;
  }

  private static resolveAvroType(options: AvroFieldOption): AvroFieldOption {
    let config: AvroFieldOption = options;

    switch (config)


    // 处理不同类型
    if (config === AVRO_TYPES.ARRAY) {
      config = this.createArrayType(options);
    } else if (config === AVRO_TYPES.ENUM) {
      config = this.createEnumType(options);
    } else if (this.isConstructor(config)) {
      config = this.generateSchema(config as Constructor);
    } else if (typeof config === 'string') {
      // 保持字符串类型不变
      config = config;
    }

    // 添加逻辑类型
    if (options.logicalType) {
      config = this.addLogicalType(config, options.logicalType);
    }

    // 处理可选字段 - 返回联合类型
    return options.optional ? [AVRO_TYPES.NULL, config] : config;
  }

  private static createArrayType(options: AvroFieldOptions): AvroArrayType {
    let itemsType: AvroFieldType = options.items || AVRO_TYPES.STRING;

    if (this.isConstructor(itemsType)) {
      itemsType = this.generateSchema(itemsType as Constructor);
    }

    return {
      type: AVRO_TYPES.ARRAY,
      items: itemsType,
    };
  }

  private static createEnumType(options: AvroFieldOptions): AvroEnumType {
    if (!options.symbols?.length) {
      throw new Error('Enum type requires non-empty symbols array');
    }

    return {
      type: AVRO_TYPES.ENUM,
      name: this.generateEnumName(),
      symbols: [...options.symbols],
    };
  }

  private static generateEnumName(): string {
    const baseName = 'EventTypeEnum';
    const count = this.enumNameCounter.get(baseName) || 0;
    this.enumNameCounter.set(baseName, count + 1);
    return count === 0 ? baseName : `${baseName}${count}`;
  }

  private static addLogicalType(
    type: AvroFieldType,
    logicalType: string,
  ): AvroLogicalType | AvroFieldType {
    if (typeof type === 'string') {
      return {
        type,
        logicalType,
      };
    }

    if (
      typeof type === 'object' &&
      type !== null &&
      !Array.isArray(type) &&
      'type' in type
    ) {
      return { ...type, logicalType } as AvroLogicalType;
    }

    // 对于复杂类型，返回原类型（可能需要根据具体需求调整）
    return type;
  }

  private static isConstructor(value: unknown): value is Constructor {
    return typeof value === 'function';
  }
}

// 抽象基类
export abstract class AvroBase {
  constructor(data?: Partial<any>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  /**
   * 生成当前实例的 Avro Schema
   */
  static getSchema<T extends AvroBase>(
    this: new (...args: any[]) => T,
  ): AvroSchema {
    return AvroSchemaGenerator.generateSchema(this);
  }

  /**
   * 获取当前实例的 Avro Schema
   */
  getSchema(): AvroSchema {
    return (this.constructor as any).getSchema();
  }

  /**
   * 验证当前实例是否符合 Schema 定义
   */
  validate(): boolean {
    // 基础验证逻辑，可以根据需要扩展
    const schema = this.getSchema();
    const requiredFields = schema.fields.filter(
      (field) => !Array.isArray(field.type) || !field.type.includes('null'),
    );

    return requiredFields.every(
      (field) =>
        (this as any)[field.name] !== undefined &&
        (this as any)[field.name] !== null,
    );
  }
}

// ========== example usage ==========

@AvroSchema({
  namespace: 'com.flip.personalization',
  name: 'EventTag',
})
export class EventTag extends AvroBase {
  @AvroField({ type: 'string' })
  name: string;

  @AvroField({ type: 'string' })
  value: string;

  constructor(data?: Partial<EventTag>) {
    super(data);
  }
}

@AvroSchema({
  namespace: 'com.flip.personalization',
  name: 'EventMetadata',
})
export class EventMetadata extends AvroBase {
  @AvroField({ type: 'string' })
  source: string;

  @AvroField({
    type: 'string',
    optional: true,
    default: null,
  })
  campaign?: string;

  constructor(data?: Partial<EventMetadata>) {
    super(data);
  }
}

@AvroSchema({
  namespace: 'flip.p13n',
  name: 'UserTestEvent',
  doc: 'Test event for user interactions',
})
export class UserTestEvent extends AvroBase {
  @AvroField({ type: 'string' })
  userId: string;

  @AvroField({
    type: 'long',
    logicalType: 'timestamp-millis',
  })
  timestamp: number;

  @AvroField({
    type: EventMetadata,
    optional: true,
    default: null,
  })
  metadata?: EventMetadata;

  @AvroField({
    type: 'array',
    items: 'string',
  })
  tags: string[];

  @AvroField({
    type: 'array',
    items: EventTag,
  })
  eventTags: EventTag[];

  constructor(data?: Partial<UserTestEvent>) {
    super(data);
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

export const testSchemaData = AvroSchemaGenerator.generateSchema(UserTestEvent);

async function testSchemaIsEq(): Promise<void> {
  try {
    const data = (await import('./test-schema.json')).default;
    assert.deepStrictEqual(data, testSchemaData);

    const isEq = isEqual(data, testSchemaData);
    console.log('Schema equality:', isEq);
  } catch (error) {
    console.error('Schema comparison failed:', error);
    throw error;
  }
}

testSchemaIsEq().catch(console.error);
