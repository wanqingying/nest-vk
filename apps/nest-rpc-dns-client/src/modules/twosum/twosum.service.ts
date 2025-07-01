import { Injectable } from '@nestjs/common';

@Injectable()
export class TwosumService {
  public async twosum(a: number, b: number): Promise<number> {
    console.log('add twosum ', a, b);
    return a + b;
  }
}
