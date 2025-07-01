import {
  Injectable,
  Inject,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import { MathService } from '../../modules/math/math.service';
import { BModule, BService } from '../../modules/moduleb/b.module';
import { NestLogger } from '@libs/utils';
@Injectable()
export class HealthService implements OnApplicationShutdown, OnModuleDestroy {
  constructor(private readonly service: MathService) {
    // console.log(this.mathService.twoSum(1,2))
  }
  async add(): Promise<any> {
    return this.service.add(2, 3);
  }

  onModuleDestroy() {
    NestLogger.log('Module is being destroyed');
  }

  onApplicationShutdown(signal: string) {
    NestLogger.log(`Application is shutting down due to: ${signal}`);
  }
}
