import 'reflect-metadata';

// 装饰器类型定义
interface AvroSchemaOptions {
  namespace?: string;
  name?: string;
  doc?: string;
}

interface AvroFieldOptions {
  type?: string | any;
  logicalType?: string;
  default?: any;
  doc?: string;
  optional?: boolean;
  items?: string | any; // 支持数组元素类型
  elementType?: any; // 支持嵌套类型构造函数
}

// Schema 装饰器
export function AvroSchema(options: AvroSchemaOptions) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata('avro:schema', options, constructor);
    return constructor;
  };
}

// 字段装饰器
export function AvroField(options: AvroFieldOptions) {
  return function (target: any, propertyKey: string) {
    const existingFields =
      Reflect.getMetadata('avro:fields', target.constructor) || {};
    existingFields[propertyKey] = options;
    Reflect.defineMetadata('avro:fields', existingFields, target.constructor);
  };
}

// Schema 生成器
export class AvroSchemaGenerator {
  static generateSchema(constructor: any): any {
    const schemaOptions = Reflect.getMetadata('avro:schema', constructor);
    const fieldOptions = Reflect.getMetadata('avro:fields', constructor) || {};

    if (!schemaOptions) {
      throw new Error(`No @AvroSchema decorator found on ${constructor.name}`);
    }

    const fields = Object.entries(fieldOptions).map(
      ([fieldName, options]: [string, any]) => {
        return {
          name: fieldName,
          type: this.resolveAvroType(options),
          ...(options.default !== undefined && { default: options.default }),
          ...(options.doc && { doc: options.doc }),
        };
      },
    );

    return {
      type: 'record',
      name: schemaOptions.name || constructor.name,
      namespace: schemaOptions.namespace,
      fields,
      ...(schemaOptions.doc && { doc: schemaOptions.doc }),
    };
  }

  private static resolveAvroType(options: AvroFieldOptions): any {
    let type = options.type || 'string';

    // 处理数组类型
    if (type === 'array') {
      if (options.elementType) {
        // 如果是嵌套类型，生成嵌套schema
        const nestedSchema = this.generateSchema(options.elementType);
        type = {
          type: 'array',
          items: nestedSchema,
        };
      } else if (options.items) {
        type = {
          type: 'array',
          items: options.items,
        };
      } else {
        type = {
          type: 'array',
          items: 'string', // 默认字符串数组
        };
      }
    }
    // 处理记录类型
    else if (type === 'record' && options.elementType) {
      type = this.generateSchema(options.elementType);
    }
    // 处理枚举类型
    else if (type === 'enum' && options.items) {
      type = {
        type: 'enum',
        name: 'EventType',
        symbols: options.items,
      };
    }

    // 处理逻辑类型
    if (options.logicalType) {
      if (typeof type === 'object' && type.type) {
        type.logicalType = options.logicalType;
      } else {
        type = {
          type,
          logicalType: options.logicalType,
        };
      }
    }

    // 处理可选字段
    if (options.optional) {
      type = ['null', type];
    }

    return type;
  }
}

// Example usage of the Avro schema and field decorators

@AvroSchema({
  namespace: 'com.flip.personalization',
  name: 'EventMetadata',
})
export class EventMetadata {
  @AvroField({ type: 'string' })
  source: string;

  @AvroField({
    type: 'string',
    optional: true,
    default: null,
  })
  campaign?: string;
}

@AvroSchema({})
export class EventTag {
  @AvroField({ type: 'string' })
  tagName: string;

  @AvroField({ type: 'int' })
  tagValue: number;

  constructor(data: Partial<EventTag>) {
    Object.assign(this, data);
  }
}

@AvroSchema({
  namespace: 'com.flip.personalization',
  name: 'UserEvent',
  doc: 'User interaction event',
})
export class UserEvent {
  @AvroField({ type: 'string' })
  userId: string;

  @AvroField({
    type: 'long',
    logicalType: 'timestamp-millis',
  })
  timestamp: number;

  @AvroField({
    type: 'enum',
    items: ['click', 'view', 'purchase'],
  })
  eventType: 'click' | 'view' | 'purchase';

  @AvroField({
    type: 'record',
    elementType: EventMetadata,
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
    elementType: EventTag,
  })
  eventTags: EventTag[];

  constructor(data: Partial<UserEvent>) {
    Object.assign(this, data);
  }
}

const schemaData = AvroSchemaGenerator.generateSchema(UserEvent);
console.log(JSON.stringify(schemaData, null, 2));
