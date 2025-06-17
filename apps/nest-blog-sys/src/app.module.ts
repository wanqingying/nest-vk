import { Module } from '@nestjs/common';
import { HealthModule } from './api/health/health.module';
import { BlogModule } from './api/blog/blog.module';

@Module({
  imports: [HealthModule, BlogModule],
  controllers: [],
  providers: [],
})
export class NestAppModule {}
