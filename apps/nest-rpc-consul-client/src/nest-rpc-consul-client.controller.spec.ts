import { Test, TestingModule } from '@nestjs/testing';
import { NestRpcConsulClientController } from './nest-rpc-consul-client.controller';
import { NestRpcConsulClientService } from './nest-rpc-consul-client.service';

describe('NestRpcConsulClientController', () => {
  let nestRpcConsulClientController: NestRpcConsulClientController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NestRpcConsulClientController],
      providers: [NestRpcConsulClientService],
    }).compile();

    nestRpcConsulClientController = app.get<NestRpcConsulClientController>(NestRpcConsulClientController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(nestRpcConsulClientController.getHello()).toBe('Hello World!');
    });
  });
});
