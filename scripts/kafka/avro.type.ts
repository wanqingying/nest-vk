//"virtual" namespace (no JS, just types) for Avro Schema
export namespace schema {
  export type AvroSchema = DefinedType | DefinedType[];
  export type DefinedType = PrimitiveType | ComplexType | LogicalType | string;
  export type PrimitiveType =
    | 'null'
    | 'boolean'
    | 'int'
    | 'long'
    | 'float'
    | 'double'
    | 'bytes'
    | 'string';
  export type ComplexType =
    | NamedType
    | RecordType
    | EnumType
    | MapType
    | ArrayType
    | FixedType;
  export type LogicalType = ComplexType & LogicalTypeExtension;

  export interface NamedType {
    type: PrimitiveType;
  }

  export interface RecordType {
    type: 'record' | 'error';
    name: string;
    namespace?: string;
    doc?: string;
    aliases?: string[];
    fields: {
      name: string;
      doc?: string;
      type: Schema;
      default?: any;
      order?: 'ascending' | 'descending' | 'ignore';
    }[];
  }

  export interface EnumType {
    type: 'enum';
    name: string;
    namespace?: string;
    aliases?: string[];
    doc?: string;
    symbols: string[];
    default?: string;
  }

  export interface ArrayType {
    type: 'array';
    items: Schema;
  }

  export interface MapType {
    type: 'map';
    values: Schema;
  }

  export interface FixedType {
    type: 'fixed';
    name: string;
    aliases?: string[];
    size: number;
  }
  export interface LogicalTypeExtension {
    logicalType: string;
    [param: string]: any;
  }
}

//Types of Options/arguments

export type Schema = schema.AvroSchema;
