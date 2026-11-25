import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { NhanVien } from '../nhanvien/entities/nhanvien.entity';
import { ChamCong } from '../chamcong/entities/chamcong.entity';
import { NghiPhep } from '../nghi-phep/entities/nghi-phep.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(NhanVien)
    private readonly nhanVienRepo: Repository<NhanVien>,
    @InjectRepository(ChamCong)
    private readonly chamCongRepo: Repository<ChamCong>,
    @InjectRepository(NghiPhep)
    private readonly nghiPhepRepo: Repository<NghiPhep>,
  ) {}

  async getDashboardStats() {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    // Chạy song song toàn bộ truy vấn thống kê để giảm độ trễ mạng với Neon DB
    const [totalEmployees, todayCheckins, onLeaveResult] = await Promise.all([
      this.nhanVienRepo.count(),
      this.chamCongRepo.find({
        where: { gioVao: Between(startOfDay, endOfDay) },
        relations: ['nhanVien'],
        select: {
          maCC: true,
          gioRa: true,
          trangThai: true,
          nhanVien: { maNV: true },
        },
      }),
      this.nghiPhepRepo.find({
        where: {
          ngayBatDau: LessThanOrEqual(today),
          ngayKetThuc: MoreThanOrEqual(today),
          trangThai: 'da-duyet',
        },
        relations: ['nhanVien'],
        select: {
          maDon: true,
          nhanVien: { maNV: true },
        },
      }),
    ]);

    const working = todayCheckins.filter((c) => !c.gioRa).length;
    const late = todayCheckins.filter(
      (c) => c.trangThai === 'di-tre' || c.trangThai === 'tre-va-ve-som',
    ).length;
    const onLeave = onLeaveResult.length;

    const checkedInIds = new Set(
      todayCheckins.map((c) => c.nhanVien?.maNV).filter(Boolean),
    );
    const onLeaveIds = new Set(
      onLeaveResult.map((l) => l.nhanVien?.maNV).filter(Boolean),
    );

    const absent =
      totalEmployees - new Set([...checkedInIds, ...onLeaveIds]).size;

    return {
      totalEmployees,
      working,
      late,
      onLeave,
      absent: absent > 0 ? absent : 0,
    };
  }
}
