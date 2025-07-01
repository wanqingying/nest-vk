import { Controller, Get } from '@nestjs/common';
import { NestRpcConsulServerService } from './nest-rpc-consul-server.service';

@Controller()
export class NestRpcConsulServerController {
  constructor(private readonly nestRpcConsulServerService: NestRpcConsulServerService) {}

  @Get()
  getHello(): string {
    return this.nestRpcConsulServerService.getHello();
  }
}
