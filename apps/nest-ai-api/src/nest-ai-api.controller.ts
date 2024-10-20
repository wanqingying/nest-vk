import { Controller, Get } from '@nestjs/common';
import { NestAiApiService } from './nest-ai-api.service';

@Controller()
export class NestAiApiController {
  constructor(private readonly nestAiApiService: NestAiApiService) {}

  @Get()
  getHello(): string {
    return this.nestAiApiService.getHello();
  }
}
