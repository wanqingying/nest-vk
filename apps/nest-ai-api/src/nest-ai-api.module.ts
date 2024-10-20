import { Module } from '@nestjs/common';
import { NestAiApiController } from './nest-ai-api.controller';
import { NestAiApiService } from './nest-ai-api.service';
import { ChatModule } from './api/chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [NestAiApiController],
  providers: [NestAiApiService],
})
export class NestAiApiModule {}
