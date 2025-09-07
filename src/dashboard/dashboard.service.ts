import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { NhanVien } from '../nhanvien/entities/nhanvien.entity';
import { ChamCong } from '../chamcong/entities/chamcong.entity';
import { NghiPhep } from '../nghi-phep/entities/nghi-phep.entity'; // Giả sử bạn có entity này

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(NhanVien)
    private readonly nhanVienRepo: Repository<NhanVien>,
    @InjectRepository(ChamCong)
    private readonly chamCongRepo: Repository<ChamCong>,
    @InjectRepository(NghiPhep)
    private readonly nghiPhepRepo: Repository<NghiPhep>, // Giả sử bạn có repo này
  ) {}

  async getDashboardStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // 1. Tổng số nhân viên
    const totalEmployees = await this.nhanVienRepo.count();

    // 2. Đang làm việc (check-in hôm nay, chưa check-out)
    const working = await this.chamCongRepo.count({
      where: {
        gioVao: Between(startOfDay, endOfDay),
        gioRa: IsNull(),
      },
    });

    // 3. Nghỉ phép (đơn được duyệt và hôm nay nằm trong khoảng nghỉ)
    // Lưu ý: Logic này giả định bạn có entity NghiPhep với các trường và trạng thái tương ứng
    const onLeave = await this.nghiPhepRepo.count({
      where: {
        ngayBatDau: LessThanOrEqual(today),
        ngayKetThuc: MoreThanOrEqual(today),
        trangThai: 'da-duyet',
      },
    });
    
    // 4. Vắng mặt
    // Lấy mã nhân viên đã check-in hôm nay
    const checkedInResult = await this.chamCongRepo.find({
        where: { gioVao: Between(startOfDay, endOfDay) },
        relations: ['nhanVien'],
        select: { nhanVien: { maNV: true } }
    });
    const checkedInIds = new Set(checkedInResult.map(c => c.nhanVien.maNV));

    // Lấy mã nhân viên đang nghỉ phép hôm nay
    const onLeaveResult = await this.nghiPhepRepo.find({
        where: {
            ngayBatDau: LessThanOrEqual(today),
            ngayKetThuc: MoreThanOrEqual(today),
            trangThai: 'da-duyet',
        },
        relations: ['nhanVien'],
        select: { nhanVien: { maNV: true } }
    });
    const onLeaveIds = new Set(onLeaveResult.map(l => l.nhanVien.maNV));

    const absent = totalEmployees - new Set([...checkedInIds, ...onLeaveIds]).size;

    return {
      totalEmployees,
      working,
      onLeave,
      absent: absent > 0 ? absent : 0,
    };
  }
}
