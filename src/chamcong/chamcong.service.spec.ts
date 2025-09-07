import { Test, TestingModule } from '@nestjs/testing';
import { ChamcongService } from './chamcong.service';

describe('ChamcongService', () => {
  let service: ChamcongService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChamcongService],
    }).compile();

    service = module.get<ChamcongService>(ChamcongService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
