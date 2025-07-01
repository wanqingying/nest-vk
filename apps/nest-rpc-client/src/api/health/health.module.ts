import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { MathModule } from '../../modules/math/math.module';
import { TwosumModule, TwosumService } from '../../modules/twosum/twosum.module';

@Module({
  imports: [
    TwosumModule,
    // MathModule.forFeature(TwosumService),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}