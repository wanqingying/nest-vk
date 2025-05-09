import {
  Prop,
  Schema,
  SchemaFactory,
  DefinitionsFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


@Schema({
  collection: 'cats',
})
export class Cat {
  @Prop({ required: true })
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;

  @Prop([String])
  tags: string[];
}

export type CatDocument = HydratedDocument<Cat>;


// const Dog=DefinitionsFactory.createForClass(class)

// DefinitionsFactory use case

export const CatSchema = SchemaFactory.createForClass(Cat);
