import { Module } from '@nestjs/common';
import { TwosumService } from './twosum.service';

@Module({
  controllers: [],
  providers: [TwosumService],
  exports: [TwosumService],
})
export class TwosumModule {
  constructor() {
    console.log('TwosumModule constructor');
  }
}
export { TwosumService };
