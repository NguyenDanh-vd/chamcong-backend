import { Test, TestingModule } from '@nestjs/testing';
import { LamThemService } from './lam-them.service';

describe('LamThemService', () => {
  let service: LamThemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LamThemService],
    }).compile();

    service = module.get<LamThemService>(LamThemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
