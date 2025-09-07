import { Test, TestingModule } from '@nestjs/testing';
import { NhanvienService } from './nhanvien.service';

describe('NhanvienService', () => {
  let service: NhanvienService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NhanvienService],
    }).compile();

    service = module.get<NhanvienService>(NhanvienService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
