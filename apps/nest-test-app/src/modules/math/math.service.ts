import { Injectable, Inject } from '@nestjs/common';

export abstract class TwoSumT {
  public abstract twosum(a: number, b: number): any;
}

@Injectable()
export class MathService {
  constructor(
    @Inject('TS')
    private readonly twoSumService: TwoSumT,
  ) {}
  public async add(a: number, b: number): Promise<number> {
    console.log('add math ', a, b);
    return this.twoSumService.twosum(a, b);
  }
}
