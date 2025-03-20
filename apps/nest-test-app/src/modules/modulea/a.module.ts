import { Global, Module } from '@nestjs/common';
import { AService } from './a.service';

@Global()
@Module({
  providers: [AService],
  exports: [AService],
})
export class AModule {}

export { AService };
