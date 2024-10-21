import { Module } from '@nestjs/common';

// config
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './api/health/health.module';
import { HeroModule } from './grpc/hero/hero.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    HeroModule,
  ],
  controllers: [],
})
export class NestAiApiModule {}
