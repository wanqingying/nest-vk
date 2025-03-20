import { Injectable } from '@nestjs/common';

@Injectable()
export class TwosumService {
  constructor() {
    console.log('TwosumService constructor');
  }
  public async twosum(a: number, b: number): Promise<number> {
    console.log('add twosum ', a, b);
    return a + b;
  }
}
