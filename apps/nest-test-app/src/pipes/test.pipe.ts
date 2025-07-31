import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TestV1Pipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log('TestV1Pipe', value, metadata);
    return { ...value, TestV1Valid: 1 };
  }
}

@Injectable()
export class TestV2Pipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log('TestV2Pipe', value, metadata);
    return { ...value, TestV2Valid: 1 };
  }
}
