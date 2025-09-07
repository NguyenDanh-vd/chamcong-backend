import { Test, TestingModule } from '@nestjs/testing';
import { BaoCaoService } from './baocao.service';

describe('BaocaoService', () => {
  let service:BaoCaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaoCaoService],
    }).compile();

    service = module.get<BaoCaoService>(BaoCaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
