import { Test, TestingModule } from '@nestjs/testing';
import { FaceDataService } from './face-data.service';

describe('FaceDataService', () => {
  let service: FaceDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaceDataService],
    }).compile();

    service = module.get<FaceDataService>(FaceDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
