import { Injectable, Inject } from '@nestjs/common';

export interface TwoSumService {
  twoSum(a: number, b: number): number;
}

@Injectable()
export class MathService {
  constructor(private readonly twoSumService: TwoSumService) {}
  public async add(a: number, b: number): Promise<number> {
    console.log('add math ', a, b);
    return this.twoSumService.twoSum(a, b);
  }
}
