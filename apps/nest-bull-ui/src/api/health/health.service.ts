import {
  Injectable,
  Inject,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import { NestLogger } from '@libs/utils/src';
@Injectable()
export class HealthService implements OnApplicationShutdown, OnModuleDestroy {
  constructor() {
    // console.log(this.mathService.twoSum(1,2))
  }
  async add(): Promise<any> {
    // return this.service.add(2, 3);
  }

  onModuleDestroy() {
    NestLogger.log('Module is being destroyed');
  }

  onApplicationShutdown(signal: string) {
    NestLogger.log(`Application is shutting down due to: ${signal}`);
  }
}
