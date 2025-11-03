import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NghiPhep } from './entities/nghi-phep.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Injectable()
export class NghiPhepService {
  constructor(
    @InjectRepository(NghiPhep)
    private npRepo: Repository<NghiPhep>,
    @InjectRepository(NhanVien)
    private nvRepo: Repository<NhanVien>,
  ) {}

  // Nhân viên xin nghỉ
  async create(maNV: number, data: Partial<NghiPhep>): Promise<NghiPhep> {
    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Không tìm thấy nhân viên');

    const don = this.npRepo.create({ ...data, nhanVien: nv, trangThai: 'cho-duyet' });
    return this.npRepo.save(don);
  }

  // Nhân viên xem danh sách đơn nghỉ của mình
  async getByNhanVien(maNV: number): Promise<NghiPhep[]> {
    return this.npRepo.find({
      where: { nhanVien: { maNV } },
      order: { ngayTao: 'DESC' },
    });
  }

  async getAll(): Promise<NghiPhep[]> {
  return this.npRepo.find({
    relations: ['nhanVien'],
    order: { ngayTao: 'DESC' },
  })
 }

  // HR/Quản trị viên duyệt hoặc từ chối đơn
  async duyet(maDon: number, trangThai: string): Promise<NghiPhep> {
    const don = await this.npRepo.findOne({ where: { maDon }, relations: ['nhanVien'] });
    if (!don) throw new NotFoundException('Không tìm thấy đơn nghỉ phép');
    don.trangThai = trangThai;
    return this.npRepo.save(don);
  }

  async remove(maDon: number) {
  const don = await this.npRepo.findOne({ where: { maDon } });
  if (!don) throw new NotFoundException('Không tìm thấy đơn nghỉ phép');
  return this.npRepo.remove(don);
}
}
