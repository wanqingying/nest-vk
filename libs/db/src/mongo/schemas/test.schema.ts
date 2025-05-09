import {
  Prop,
  Schema,
  SchemaFactory,
  DefinitionsFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


@Schema({
  collection: 'test_collection',
})
export class TestCollection {
  @Prop({ required: true })
  name: string;

  @Prop()
  age: number;

  @Prop()
  resourceId: string;

  @Prop([String])
  tags: string[];
}

export type TestDocument = HydratedDocument<TestCollection>;


// const Dog=DefinitionsFactory.createForClass(class)

// DefinitionsFactory use case

export const TestSchema = SchemaFactory.createForClass(TestCollection);
