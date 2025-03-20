import { Injectable, Inject } from '@nestjs/common';
import { MathService } from '../../modules/math/math.service';
import { BModule, BService } from '../../modules/moduleb/b.module';
@Injectable()
export class HealthService {
  constructor(private readonly service: MathService) {
    // console.log(this.mathService.twoSum(1,2))
  }
  async add(): Promise<any> {
    return this.service.add(2, 3);
  }
}
