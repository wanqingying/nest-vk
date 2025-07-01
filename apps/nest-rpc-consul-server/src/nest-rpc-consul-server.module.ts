import { Module } from '@nestjs/common';
import { NestRpcConsulServerController } from './nest-rpc-consul-server.controller';
import { NestRpcConsulServerService } from './nest-rpc-consul-server.service';

@Module({
  imports: [],
  controllers: [NestRpcConsulServerController],
  providers: [NestRpcConsulServerService],
})
export class NestRpcConsulServerModule {}
