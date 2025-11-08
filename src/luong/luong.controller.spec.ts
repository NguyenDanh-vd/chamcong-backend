import { Test, TestingModule } from '@nestjs/testing';
import { LuongController } from './luong.controller';
import { LuongService } from './luong.service';

describe('LuongController', () => {
  let controller: LuongController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LuongController],
      providers: [LuongService],
    }).compile();

    controller = module.get<LuongController>(LuongController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
