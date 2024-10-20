import { Test, TestingModule } from '@nestjs/testing';
import { NestAiApiController } from './nest-ai-api.controller';
import { NestAiApiService } from './nest-ai-api.service';

describe('NestAiApiController', () => {
  let nestAiApiController: NestAiApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NestAiApiController],
      providers: [NestAiApiService],
    }).compile();

    nestAiApiController = app.get<NestAiApiController>(NestAiApiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(nestAiApiController.getHello()).toBe('Hello World!');
    });
  });
});
