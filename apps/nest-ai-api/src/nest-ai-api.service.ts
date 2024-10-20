import { Injectable } from '@nestjs/common';

@Injectable()
export class NestAiApiService {
  getHello(): string {
    return 'Hello World!';
  }
}
