import { Module } from '@nestjs/common';
import { NestRpcConsulClientController } from './nest-rpc-consul-client.controller';
import { NestRpcConsulClientService } from './nest-rpc-consul-client.service';

@Module({
  imports: [],
  controllers: [NestRpcConsulClientController],
  providers: [NestRpcConsulClientService],
})
export class NestRpcConsulClientModule {}
