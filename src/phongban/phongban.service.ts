import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhongBan } from './entities/phongban.entity';

@Injectable()
export class PhongbanService {
  constructor(
    @InjectRepository(PhongBan)
    private readonly pbRepo: Repository<PhongBan>,
  ) {}

  // Lấy tất cả phòng ban + danh sách nhân viên trong đó
  async findAll(): Promise<PhongBan[]> {
    return this.pbRepo.find({ relations: ['nhanViens'] }); 
  }

  // Lấy 1 phòng ban theo ID
  async findOne(id: number): Promise<PhongBan> {
    const pb = await this.pbRepo.findOne({
      where: { maPB: id },
      relations: ['nhanViens'],
    });
    if (!pb) throw new NotFoundException(`Không tìm thấy phòng ban id=${id}`);
    return pb;
  }

  // Tạo mới phòng ban
  async create(data: Partial<PhongBan>): Promise<PhongBan> {
    const pb = this.pbRepo.create(data);
    const saved: PhongBan = await this.pbRepo.save(pb);
    return saved;
  }

  // Cập nhật phòng ban
  async update(id: number, data: Partial<PhongBan>): Promise<PhongBan> {
  try {
    const pb = await this.findOne(id); 

    if (data.tenPhong !== undefined && data.tenPhong !== null && data.tenPhong !== '') {
      pb.tenPhong = data.tenPhong;
    }

    if (data.moTa !== undefined) pb.moTa = data.moTa;

    const saved = await this.pbRepo.save(pb);
    return saved;
  } catch (err) {
    console.error('Lỗi update phòng ban:', err); 
    throw err; 
  }
}

  // Xóa phòng ban
  async remove(id: number): Promise<{ message: string }> {
    const pb = await this.findOne(id);
    await this.pbRepo.remove(pb);
    return { message: `Đã xóa phòng ban id=${id}` };
  }
}
