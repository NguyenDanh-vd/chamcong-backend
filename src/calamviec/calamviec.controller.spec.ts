import { Test, TestingModule } from '@nestjs/testing';
import { CalamviecController } from './calamviec.controller';
import { CalamviecService } from './calamviec.service';

describe('CalamviecController', () => {
  let controller: CalamviecController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalamviecController],
      providers: [CalamviecService],
    }).compile();

    controller = module.get<CalamviecController>(CalamviecController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
