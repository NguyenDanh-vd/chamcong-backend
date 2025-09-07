import { Test, TestingModule } from '@nestjs/testing';
import { BaoCaoController } from './baocao.controller';
import { BaoCaoService } from './baocao.service';

describe('BaocaoController', () => {
  let controller: BaoCaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaoCaoController],
      providers: [BaoCaoService],
    }).compile();

    controller = module.get<BaoCaoController>(BaoCaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
