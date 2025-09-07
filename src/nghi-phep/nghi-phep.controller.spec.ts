import { Test, TestingModule } from '@nestjs/testing';
import { NghiPhepController } from './nghi-phep.controller';
import { NghiPhepService } from './nghi-phep.service';

describe('NghiPhepController', () => {
  let controller: NghiPhepController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NghiPhepController],
      providers: [NghiPhepService],
    }).compile();

    controller = module.get<NghiPhepController>(NghiPhepController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
