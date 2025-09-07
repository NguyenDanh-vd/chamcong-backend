import { Test, TestingModule } from '@nestjs/testing';
import { NghiPhepService } from './nghi-phep.service';

describe('NghiPhepService', () => {
  let service: NghiPhepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NghiPhepService],
    }).compile();

    service = module.get<NghiPhepService>(NghiPhepService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
