import { Test, TestingModule } from '@nestjs/testing';
import { NestRpcConsulServerController } from './nest-rpc-consul-server.controller';
import { NestRpcConsulServerService } from './nest-rpc-consul-server.service';

describe('NestRpcConsulServerController', () => {
  let nestRpcConsulServerController: NestRpcConsulServerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NestRpcConsulServerController],
      providers: [NestRpcConsulServerService],
    }).compile();

    nestRpcConsulServerController = app.get<NestRpcConsulServerController>(NestRpcConsulServerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(nestRpcConsulServerController.getHello()).toBe('Hello World!');
    });
  });
});
