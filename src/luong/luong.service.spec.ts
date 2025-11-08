import { Test, TestingModule } from '@nestjs/testing';
import { LuongService } from './luong.service';

describe('LuongService', () => {
  let service: LuongService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LuongService],
    }).compile();

    service = module.get<LuongService>(LuongService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
