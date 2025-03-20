import { Global, Injectable } from '@nestjs/common';

@Global()
@Injectable()
export class AService {
  getHello(): string {
    return 'Hello from AService';
  }
}