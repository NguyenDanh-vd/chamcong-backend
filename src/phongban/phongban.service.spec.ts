import { Test, TestingModule } from '@nestjs/testing';
import { PhongbanService } from './phongban.service';

describe('PhongbanService', () => {
  let service: PhongbanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhongbanService],
    }).compile();

    service = module.get<PhongbanService>(PhongbanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
