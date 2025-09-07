import { Test, TestingModule } from '@nestjs/testing';
import { LamThemController } from './lam-them.controller';
import { LamThemService } from './lam-them.service';

describe('LamThemController', () => {
  let controller: LamThemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LamThemController],
      providers: [LamThemService],
    }).compile();

    controller = module.get<LamThemController>(LamThemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
