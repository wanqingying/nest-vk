import { Injectable } from '@nestjs/common';

@Injectable()
export class SingleService {
  public testSingle() {
    return 'single service test';
  }
}
