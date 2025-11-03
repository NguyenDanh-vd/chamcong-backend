import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CaLamViec } from './entities/calamviec.entity';
import { ChamCong } from '../chamcong/entities/chamcong.entity';
import { NhanVien } from '../nhanvien/entities/nhanvien.entity';
import { format } from 'date-fns';
import { CreateCaLamViecDto } from './dto/create-calamviec.dto';
import { UpdateCaLamViecDto } from './dto/update-calamviec.dto';

@Injectable()
export class CalamviecService {
  constructor(
    @InjectRepository(CaLamViec)
    private caRepo: Repository<CaLamViec>,

    @InjectRepository(ChamCong)
    private readonly chamCongRepo: Repository<ChamCong>,

    @InjectRepository(NhanVien)
    private readonly nhanVienRepo: Repository<NhanVien>,
  ) {}

  // Xác định ca hiện tại (chỉ ca đang hoạt động)
  async getCurrentShift(): Promise<CaLamViec | null> {
    const nowInVietnam = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );
    const currentHour = nowInVietnam.getHours();
    const currentMinute = nowInVietnam.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const activeShifts = await this.caRepo.find({ where: { trangThai: true } });

    for (const shift of activeShifts) {
      const [startHour, startMinute] = shift.gioBatDau.split(':').map(Number);
      const [endHour, endMinute] = shift.gioKetThuc.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;

      // Ca trong ngày (08:00 → 17:00)
      if (startTotalMinutes <= endTotalMinutes) {
        if (
          currentTotalMinutes >= startTotalMinutes &&
          currentTotalMinutes <= endTotalMinutes
        ) {
          return shift;
        }
      }
      // Ca qua đêm (22:00 → 06:00)
      else {
        if (
          currentTotalMinutes >= startTotalMinutes ||
          currentTotalMinutes <= endTotalMinutes
        ) {
          return shift;
        }
      }
    }

    return null;
  }

  // Lấy dữ liệu dashboard trong ngày theo giờ VN
  async getTodayShifts() {
    const nowInVietnam = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );

    const startOfDay = new Date(nowInVietnam);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(nowInVietnam);
    endOfDay.setHours(23, 59, 59, 999);

    const todayCheckins = await this.chamCongRepo.find({
      where: { gioVao: Between(startOfDay, endOfDay) },
      relations: ['nhanVien', 'caLamViec'],
    });

    const checkinsMap = new Map(todayCheckins.map(c => [c.nhanVien.maNV, c]));

    const allEmployees = await this.nhanVienRepo.find({
      select: ['maNV', 'hoTen'],
    });

    return allEmployees.map(employee => {
      const checkin = checkinsMap.get(employee.maNV);

      return checkin
        ? {
            id: employee.maNV,
            name: employee.hoTen,
            maNV: employee.maNV,
            shift: checkin.caLamViec?.tenCa || '--',
            start: checkin.gioVao
              ? format(new Date(checkin.gioVao), 'HH:mm')
              : '--',
            end: checkin.gioRa
              ? format(new Date(checkin.gioRa), 'HH:mm')
              : '--',
            status: checkin.gioRa ? 'Đã check-out' : 'Đang làm việc',
          }
        : {
            id: employee.maNV,
            name: employee.hoTen,
            maNV: employee.maNV,
            shift: '--',
            start: '--',
            end: '--',
            status: 'Vắng mặt',
          };
    });
  }

  // --- CRUD ca làm việc ---
  async findAll(): Promise<CaLamViec[]> {
    return this.caRepo.find();
  }

  async findOne(id: number): Promise<CaLamViec> {
    const ca = await this.caRepo.findOne({ where: { maCa: id } });
    if (!ca) throw new NotFoundException(`Không tìm thấy ca làm việc id=${id}`);
    return ca;
  }

  async create(data: CreateCaLamViecDto): Promise<CaLamViec> {
    const ca = this.caRepo.create(data);
    return this.caRepo.save(ca);
  }

  async update(id: number, data: UpdateCaLamViecDto): Promise<CaLamViec> {
    const ca = await this.findOne(id);
    Object.assign(ca, data);
    return this.caRepo.save(ca);
  }

  async remove(id: number): Promise<{ message: string }> {
    const ca = await this.findOne(id);
    await this.caRepo.remove(ca);
    return { message: `Đã xóa ca làm việc id=${id}` };
  }

  async updateStatus(maCa: number, trangThai: boolean) {
    const ca = await this.caRepo.findOne({ where: { maCa } });
    if (!ca) throw new NotFoundException('Ca làm việc không tồn tại');
    ca.trangThai = trangThai;
    return this.caRepo.save(ca);
  }
}
