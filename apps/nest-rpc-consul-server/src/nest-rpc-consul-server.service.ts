import { Injectable } from '@nestjs/common';

@Injectable()
export class NestRpcConsulServerService {
  getHello(): string {
    return 'Hello World!';
  }
}
