import { Module } from '@nestjs/common';
import { BService } from './b.service';

@Module({
  providers: [BService],
})
export class BModule {}

export { BService };