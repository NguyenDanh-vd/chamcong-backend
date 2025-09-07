import { Test, TestingModule } from '@nestjs/testing';
import { CalamviecService } from './calamviec.service';

describe('CalamviecService', () => {
  let service: CalamviecService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalamviecService],
    }).compile();

    service = module.get<CalamviecService>(CalamviecService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
