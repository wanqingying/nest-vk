import { Module } from '@nestjs/common';
import { TwosumService } from './twosum.service';

@Module({
  controllers: [],
  providers: [TwosumService],
  exports: [TwosumService],
})
export class TwosumModule {}
export { TwosumService };
