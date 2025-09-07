import { Test, TestingModule } from '@nestjs/testing';
import { PhongbanController } from './phongban.controller';
import { PhongbanService } from './phongban.service';

describe('PhongbanController', () => {
  let controller: PhongbanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhongbanController],
      providers: [PhongbanService],
    }).compile();

    controller = module.get<PhongbanController>(PhongbanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
