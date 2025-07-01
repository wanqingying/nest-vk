import { Controller, Get } from '@nestjs/common';
import { NestRpcConsulClientService } from './nest-rpc-consul-client.service';

@Controller()
export class NestRpcConsulClientController {
  constructor(private readonly nestRpcConsulClientService: NestRpcConsulClientService) {}

  @Get()
  getHello(): string {
    return this.nestRpcConsulClientService.getHello();
  }
}
