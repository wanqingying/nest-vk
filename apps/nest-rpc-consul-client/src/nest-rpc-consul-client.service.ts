import { Injectable } from '@nestjs/common';

@Injectable()
export class NestRpcConsulClientService {
  getHello(): string {
    return 'Hello World!';
  }
}
