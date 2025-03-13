import { Module } from '@nestjs/common';
import { MicrorpcService } from './microrpc.service';

@Module({
  providers: [MicrorpcService],
  exports: [MicrorpcService],
})
export class MicrorpcModule {}
