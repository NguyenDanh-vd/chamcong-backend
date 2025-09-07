import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LamThem } from './entities/lam-them.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Injectable()
export class LamThemService {
  constructor(
    @InjectRepository(LamThem)
    private ltRepo: Repository<LamThem>,
    @InjectRepository(NhanVien)
    private nvRepo: Repository<NhanVien>,
  ) {}

  // Nhân viên đăng ký làm thêm
  async create(maNV: number, data: Partial<LamThem>): Promise<LamThem> {
    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Không tìm thấy nhân viên');

    const lt = this.ltRepo.create({
      ...data,
      nhanVien: nv,
      trangThai: 'cho-duyet',
    });
    return this.ltRepo.save(lt);
  }

  // Nhân viên xem danh sách làm thêm của mình
  async findByNhanVien(maNV: number) {
    const lamThemList = await this.ltRepo.find({
      where: { nhanVien: { maNV } },
      relations: ['nhanVien'],
      order: { ngayLT: 'DESC' },
    });

    return lamThemList.map(item => ({
      maLT: item.maLT,
      ngay: item.ngayLT,
      gioBatDau: item.gioBatDau,
      gioKetThuc: item.gioKetThuc,
      soGio: item.soGio,
      lyDo: item.ghiChu,
      trangThai: item.trangThai,
      nhanVien: item.nhanVien,
    }));
  }

  // HR/Quản trị viên duyệt đơn
  async duyet(maLT: number, trangThai: string): Promise<LamThem> {
    const lt = await this.ltRepo.findOne({
      where: { maLT },
      relations: ['nhanVien'],
    });
    if (!lt) throw new NotFoundException('Không tìm thấy đơn làm thêm');

    lt.trangThai = trangThai;
    return this.ltRepo.save(lt);
  }

  // HR/Quản trị viên xem tất cả đơn làm thêm
  async findAll() {
    const list = await this.ltRepo.find({
      relations: ['nhanVien'],
      order: { ngayLT: 'DESC' },
    });

    return list.map(item => ({
      maLT: item.maLT,
      ngay: item.ngayLT,
      gioBatDau: item.gioBatDau,
      gioKetThuc: item.gioKetThuc,
      soGio: item.soGio,
      lyDo: item.ghiChu,
      trangThai: item.trangThai,
      nhanVien: item.nhanVien,
    }));
  }
}
