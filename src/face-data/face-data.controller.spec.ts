import { Test, TestingModule } from '@nestjs/testing';
import { FaceDataController } from './face-data.controller';
import { FaceDataService } from './face-data.service';

describe('FaceDataController', () => {
  let controller: FaceDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaceDataController],
      providers: [FaceDataService],
    }).compile();

    controller = module.get<FaceDataController>(FaceDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
