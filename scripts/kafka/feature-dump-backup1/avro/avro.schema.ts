import 'reflect-metadata';
import { inspect } from 'node:util';

import { schema } from './avro.type';

export class AvroBaseDto<T = any> {
  //avro schema base class
  public constructor(data?: Partial<T>) {
    // skip
  }

  public getSchema(): schema.RecordType {
    return AvroSchemaGenerator.generateSchema(this.constructor as Constructor);
  }
}

// provide config type
export namespace avtd {
  // avsc record field type
  export interface VField {
    name: string;
    doc?: string;
    type: schema.AvroSchema;
    default?: any;
    order?: 'ascending' | 'descending' | 'ignore';
  }
  export enum types {
    string = 'string',
    long = 'long',
    boolean = 'boolean',
    int = 'int',
    double = 'double',
    float = 'float',
    null = 'null',
    array = 'array',
    enum = 'enum',
    record = 'record',
    map = 'map',
    // union = 'union',
    // logicalType = 'logicalType',
  }

  export type RefType = types | Constructor;

  interface BaseField {
    name?: string;
    doc?: string;
    default?: any;
    optional?: boolean;
    order?: 'ascending' | 'descending' | 'ignore';
  }

  interface NamedType extends BaseField {
    type: RefType;
  }

  export interface EnumType extends BaseField {
    type: types.enum;
    name: string;
    namespace?: string;
    aliases?: string[];
    doc?: string;
    symbols: string[];
    default?: string;
  }

  export interface ArrayType extends BaseField {
    type: types.array;
    items: RefType;
  }

  export interface MapType extends BaseField {
    type: types.map;
    values: RefType[];
  }

  export type AvroFieldType = NamedType | EnumType | ArrayType | MapType;

  export interface AvroSchemaConfig {
    namespace: string;
    name: string;
    topic?: string; // required when use AvroSchemaRegistry.encode
    doc?: string;
    // aliases?: string[];
  }
}

export type Constructor = new (...args: any[]) => any;

const METADATA_KEYS = {
  SCHEMA: 'avro:schema',
  FIELDS: 'avro:fields',
};

// Schema decorator
export function AvroSchema(options: avtd.AvroSchemaConfig) {
  return function <T extends Constructor>(constructor: T): T {
    Reflect.defineMetadata(METADATA_KEYS.SCHEMA, options, constructor);
    return constructor;
  };
}

export function getSchemaConfig(con: Constructor): avtd.AvroSchemaConfig {
  const options = Reflect.getMetadata(METADATA_KEYS.SCHEMA, con);
  if (!options) {
    throw new Error(
      `Missing @AvroSchema decorator on class ${con.name}. ` +
        'Please add @AvroSchema decorator with appropriate options.',
    );
  }
  return options;
}

// Field decorator
export function AvroField(options: avtd.AvroFieldType) {
  return function (
    target: any,
    propertyKey: any,
    descriptor: PropertyDescriptor,
  ) {
    if (!target) throw new Error('Target is not defined');
    const existingFields =
      Reflect.getMetadata(METADATA_KEYS.FIELDS, target.constructor) || {};
    const newFields = { ...existingFields, [propertyKey]: options };
    Reflect.defineMetadata(METADATA_KEYS.FIELDS, newFields, target.constructor);
    return descriptor;
  } as any;
}

// Schema generator
class AvroSchemaGenerator {
  private static readonly enumNameCounter = new Map<string, number>();

  public static generateSchema(
    constructor: Constructor,
    name?: string,
  ): schema.RecordType {
    const schemaOptions = this.getSchemaOptions(constructor);
    const fieldOptions = this.getFieldOptions(constructor);

    const fields = Object.entries(fieldOptions).map(([fieldName, options]) =>
      this.createField(fieldName, options),
    );

    return {
      type: avtd.types.record,
      name: name || schemaOptions.name || constructor.name,
      ...(schemaOptions.namespace && { namespace: schemaOptions.namespace }),
      fields,
      ...(schemaOptions.doc && { doc: schemaOptions.doc }),
    };
  }

  private static getSchemaOptions(
    constructor: Constructor,
  ): avtd.AvroSchemaConfig {
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
  ): Record<string, avtd.AvroFieldType> {
    return Reflect.getMetadata(METADATA_KEYS.FIELDS, constructor) || {};
  }

  private static createField(
    fieldName: string,
    options: avtd.AvroFieldType,
  ): avtd.VField {
    const type = this.resolveAvroType(options);
    const field: avtd.VField = {
      name: fieldName,
      type: type,
    };

    if (options.default !== undefined) {
      field.default = options.default;
    }
    if (options.doc) {
      field.doc = options.doc;
    }
    if (options.optional) {
      if ([undefined, null].includes(field.default)) {
        field.default = null;
        field.type = [avtd.types.null, type];
      } else {
        field.type = [type, avtd.types.null];
      }
    }
    return field;
  }

  private static resolveAvroType(
    options: avtd.AvroFieldType,
  ): schema.DefinedType {
    const config = options;
    const schema: schema.DefinedType = {
      type: avtd.types.null,
    };

    switch (config.type) {
      case avtd.types.string:
      case avtd.types.long:
      case avtd.types.boolean:
      case avtd.types.int:
      case avtd.types.double:
      case avtd.types.float:
      case avtd.types.null:
        return config.type as avtd.types;
      case avtd.types.array:
        return this.createArrayType(options as avtd.ArrayType);
      case avtd.types.enum:
        return this.createEnumType(options as avtd.EnumType);
      case avtd.types.map:
        return this.createMapType(options as avtd.MapType);
      default:
        if (this.isRef(config.type)) {
          return this.generateSchema(config.type as Constructor, config.name);
        } else {
          throw new Error('Unsupported Avro type ' + inspect(config.type));
        }
    }
  }

  private static createArrayType(options: avtd.ArrayType): schema.ArrayType {
    if (this.isRef(options.items)) {
      const ele = options.items as Constructor;
      return {
        type: avtd.types.array,
        items: this.generateSchema(ele),
      };
    } else {
      const ele = options.items as avtd.types;
      return {
        type: avtd.types.array,
        items: ele,
      };
    }
  }

  private static createMapType(options: avtd.MapType): schema.MapType {
    const resolve = (t: avtd.RefType) => {
      if (this.isRef(t)) {
        return this.generateSchema(t);
      } else {
        return t;
      }
    };

    return {
      type: avtd.types.map,
      values: options.values.map(resolve),
    };
  }

  private static createEnumType(options: avtd.EnumType): schema.EnumType {
    if (!options.symbols?.length) {
      throw new Error('Enum type requires non-empty symbols array');
    }

    return {
      type: avtd.types.enum,
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

  private static isRef(value: unknown): value is Constructor {
    return typeof value === 'function';
  }
}
