import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { MathModule } from '../../modules/math/math.module';
import {
  TwosumModule,
  TwosumService,
} from '../../modules/twosum/twosum.module';
// import { AModule, AService } from '../../modules/modulea/a.module';
// import { BModule, BService } from '../../modules/moduleb/b.module';

@Module({
  imports: [TwosumModule, MathModule.forRoot(TwosumService)],
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
