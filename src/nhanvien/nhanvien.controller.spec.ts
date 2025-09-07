import { Test, TestingModule } from '@nestjs/testing';
import { NhanvienController } from './nhanvien.controller';
import { NhanvienService } from './nhanvien.service';

describe('NhanvienController', () => {
  let controller: NhanvienController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NhanvienController],
      providers: [NhanvienService],
    }).compile();

    controller = module.get<NhanvienController>(NhanvienController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
