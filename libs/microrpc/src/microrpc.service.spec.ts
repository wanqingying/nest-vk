import { Test, TestingModule } from '@nestjs/testing';
import { MicrorpcService } from './microrpc.service';

describe('MicrorpcService', () => {
  let service: MicrorpcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MicrorpcService],
    }).compile();

    service = module.get<MicrorpcService>(MicrorpcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
