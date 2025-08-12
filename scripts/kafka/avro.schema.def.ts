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
    const existingFields = Reflect.getMetadata('avro:fields', target.constructor) || {};
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

    const fields = Object.entries(fieldOptions).map(([fieldName, options]: [string, any]) => {
      return {
        name: fieldName,
        type: this.resolveAvroType(options),
        ...(options.default !== undefined && { default: options.default }),
        ...(options.doc && { doc: options.doc }),
      };
    });

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

    // 处理逻辑类型
    if (options.logicalType) {
      type = {
        type,
        logicalType: options.logicalType,
      };
    }

    // 处理可选字段
    if (options.optional) {
      type = ['null', type];
    }

    return type;
  }
}
