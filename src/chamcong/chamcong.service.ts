import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ChamCong } from './entities/chamcong.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { CaLamViec } from 'src/calamviec/entities/calamviec.entity';
import { CreateChamCongDto } from './dto/create-chamcong.dto';
import { CalamviecService } from 'src/calamviec/calamviec.service';
import { ConfigService } from '@nestjs/config';
import { calculateDistance } from '../utils/location';

// DTO cho chức năng chấm công bằng khuôn mặt, bao gồm cả vị trí
interface PointFaceDto {
  maNV: number;
  maCa?: number;
  faceDescriptor: number[];
  latitude: number;
  longitude: number;
}

@Injectable()
export class ChamcongService {
  constructor(
    @InjectRepository(ChamCong)
    private chamCongRepo: Repository<ChamCong>,
    @InjectRepository(NhanVien)
    private nhanVienRepo: Repository<NhanVien>,
    @InjectRepository(CaLamViec)
    private caRepo: Repository<CaLamViec>,
    private readonly calamviecService: CalamviecService,
    private readonly configService: ConfigService,
  ) {}

  private getTodayRangeInVietnam() {
    const nowInVietnam = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );
    const startOfDay = new Date(nowInVietnam);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(nowInVietnam);
    endOfDay.setHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }

  private parseShiftTime(timeStr: string, refDate: Date): Date {
    const [h, m, s] = timeStr.split(':').map(Number);
    const d = new Date(refDate);
    d.setHours(h, m, s, 0);
    return d;
  }

  private mapTrangThai(status: string): string {
    const mapping: Record<string, string> = {
      'dang-lam-viec': 'Đang làm việc',
      'da-check-out': 'Đã check-out',
      'di-tre': 'Đi trễ',
      'tre-va-ve-som': 'Trễ và về sớm',
      've-som': 'Về sớm',
      'hop-le': 'Hợp lệ',
      'chua-checkin': 'Chưa check-in',
    };
    return mapping[status] || status;
  }

  private tinhThongTinCong(chamCong: ChamCong) {
    let soPhutDiTre = 0;
    let soPhutVeSom = 0;
    let soGioLam = 0;
    if (chamCong.caLamViec && chamCong.gioVao) {
      const gioBatDau = this.parseShiftTime(
        chamCong.caLamViec.gioBatDau,
        chamCong.gioVao,
      );
      if (chamCong.gioVao > gioBatDau) {
        soPhutDiTre = Math.floor(
          (chamCong.gioVao.getTime() - gioBatDau.getTime()) / (1000 * 60),
        );
      }
    }
    if (chamCong.caLamViec && chamCong.gioRa) {
      const gioKetThuc = this.parseShiftTime(
        chamCong.caLamViec.gioKetThuc,
        chamCong.gioRa,
      );
      if (chamCong.gioRa < gioKetThuc) {
        soPhutVeSom = Math.floor(
          (gioKetThuc.getTime() - chamCong.gioRa.getTime()) / (1000 * 60),
        );
      }
    }
    if (chamCong.gioVao && chamCong.gioRa) {
      soGioLam =
        (chamCong.gioRa.getTime() - chamCong.gioVao.getTime()) / (1000 * 60 * 60);
    }
    return { soPhutDiTre, soPhutVeSom, soGioLam };
  }

  async checkIn({ maNV, maCa }: { maNV: number; maCa?: number; }): Promise<ChamCong> {
    const nhanVien = await this.nhanVienRepo.findOneBy({ maNV });
    if (!nhanVien) throw new NotFoundException('Không tìm thấy nhân viên');
    const caLamViec = maCa
      ? await this.caRepo.findOneBy({ maCa })
      : await this.calamviecService.getCurrentShift();
    if (!caLamViec)
      throw new BadRequestException('Không tìm thấy ca làm việc phù hợp');
    const { startOfDay, endOfDay } = this.getTodayRangeInVietnam();
    const existing = await this.chamCongRepo.findOne({
      where: { nhanVien: { maNV }, gioVao: Between(startOfDay, endOfDay) },
    });
    if (existing) throw new BadRequestException('Nhân viên đã check-in hôm nay');
    const gioVao = new Date();
    const gioBatDau = this.parseShiftTime(caLamViec.gioBatDau, gioVao);
    const trangThai = gioVao > gioBatDau ? 'di-tre' : 'hop-le';
    const chamCong = this.chamCongRepo.create({
      nhanVien,
      caLamViec,
      gioVao,
      trangThai,
    });
    return this.chamCongRepo.save(chamCong);
  }

  async checkOut(maNV: number): Promise<ChamCong> {
    const { startOfDay, endOfDay } = this.getTodayRangeInVietnam();
    const chamCong = await this.chamCongRepo.findOne({
      where: { nhanVien: { maNV }, gioVao: Between(startOfDay, endOfDay) },
      relations: ['caLamViec'],
    });
    if (!chamCong)
      throw new NotFoundException('Chưa có bản ghi check-in hôm nay');
    if (chamCong.gioRa) throw new BadRequestException('Đã check-out rồi');
    chamCong.gioRa = new Date();
    const gioKetThuc = this.parseShiftTime(
      chamCong.caLamViec.gioKetThuc,
      chamCong.gioRa,
    );
    if (chamCong.trangThai === 'di-tre' && chamCong.gioRa < gioKetThuc) {
      chamCong.trangThai = 'tre-va-ve-som';
    } else if (chamCong.gioRa < gioKetThuc) {
      chamCong.trangThai = 've-som';
    } else if (chamCong.trangThai !== 'di-tre') {
      chamCong.trangThai = 'hop-le';
    }
    chamCong.soGioLam =
      (chamCong.gioRa.getTime() - chamCong.gioVao.getTime()) / (1000 * 60 * 60);
    return this.chamCongRepo.save(chamCong);
  }

  async pointWithFace(body: PointFaceDto) {
    const { maNV, maCa, latitude, longitude } = body;
    
    const latStr = this.configService.get<string>('COMPANY_LATITUDE');
    const lonStr = this.configService.get<string>('COMPANY_LONGITUDE');
    const radiusStr = this.configService.get<string>('ALLOWED_CHECKIN_RADIUS_METERS');

    if (!latStr || !lonStr || !radiusStr) {
      throw new BadRequestException(
        'Server chưa được cấu hình tọa độ công ty. Vui lòng liên hệ quản trị viên.',
      );
    }

    const companyLat = parseFloat(latStr);
    const companyLon = parseFloat(lonStr);
    const allowedRadius = parseInt(radiusStr, 10);
    
    const distance = calculateDistance(latitude, longitude, companyLat, companyLon);

    if (distance > allowedRadius) {
      throw new BadRequestException(
        `Bạn không ở trong khu vực công ty để chấm công. Khoảng cách hiện tại: ${Math.round(distance)} mét.`,
      );
    }
    
    const nhanVien = await this.nhanVienRepo.findOneBy({ maNV: maNV });
    if (!nhanVien) throw new NotFoundException('Không tìm thấy nhân viên');

    const { startOfDay, endOfDay } = this.getTodayRangeInVietnam();
    const existing = await this.chamCongRepo.findOne({
      where: {
        nhanVien: { maNV: maNV },
        gioVao: Between(startOfDay, endOfDay),
      },
    });

    if (!existing) {
      const record = await this.checkIn({ maNV: maNV, maCa: maCa });
      return { action: 'checkin', data: record };
    }

    if (!existing.gioRa) {
      const record = await this.checkOut(maNV);
      return { action: 'checkout', data: record };
    }

    throw new BadRequestException('Hôm nay đã hoàn tất chấm công');
  }

  async getTodayRecord(maNV: number): Promise<ChamCong | null> {
    try {
      const { startOfDay, endOfDay } = this.getTodayRangeInVietnam();
      const record = await this.chamCongRepo.findOne({
        where: { nhanVien: { maNV }, gioVao: Between(startOfDay, endOfDay) },
        relations: ['caLamViec', 'nhanVien'],
      });

      return record || null;
    } catch (error) {
      console.error('getTodayRecord error:', error);
      throw new BadRequestException('Không thể lấy dữ liệu chấm công hôm nay');
    }
  }

  async getTodayStatus(maNV: number) {
    const record = await this.getTodayRecord(maNV);

    if (!record) {
      return {
        status: 'chua-checkin',
        statusText: this.mapTrangThai('chua-checkin'),
      };
    }

    if (!record.gioRa) {
      const gioVao = new Date(record.gioVao);
      const gioBatDau = this.parseShiftTime(record.caLamViec.gioBatDau, gioVao);
      const status = gioVao > gioBatDau ? 'di-tre' : 'dang-lam-viec';
      return { status, statusText: this.mapTrangThai(status), record };
    }

    const gioRa = new Date(record.gioRa);
    const gioKetThuc = this.parseShiftTime(record.caLamViec.gioKetThuc, gioRa);
    const status = gioRa < gioKetThuc ? 've-som' : record.trangThai || 'hop-le';
    return { status, statusText: this.mapTrangThai(status), record };
  }

  async createByAdmin(dto: CreateChamCongDto) {
    const nhanVien = await this.nhanVienRepo.findOneBy({ maNV: dto.maNV });
    if (!nhanVien) throw new NotFoundException('Không tìm thấy nhân viên');
    const caLamViec = dto.maCa
      ? await this.caRepo.findOneBy({ maCa: dto.maCa })
      : await this.calamviecService.getCurrentShift();
    if (!caLamViec) throw new NotFoundException('Không tìm thấy ca làm việc');
    const chamCong = this.chamCongRepo.create({ ...dto, nhanVien, caLamViec });
    return this.chamCongRepo.save(chamCong);
  }

  async getByNhanVien(maNV: number) {
    const list = await this.chamCongRepo.find({
      where: { nhanVien: { maNV } },
      relations: ['nhanVien', 'caLamViec'],
      order: { gioVao: 'DESC' },
    });
    return list.map((c) => ({
      ...c,
      ...this.tinhThongTinCong(c),
      trangThaiText: this.mapTrangThai(c.trangThai),
    }));
  }

  async filterChamCong(query: {
    maNV?: number;
    hoTen?: string;
    tenCa?: string;
    trangThai?: string;
    tuNgay?: string;
    denNgay?: string;
  }) {
    const qb = this.chamCongRepo
      .createQueryBuilder('cc')
      .leftJoinAndSelect('cc.nhanVien', 'nv')
      .leftJoinAndSelect('cc.caLamViec', 'ca');
    if (query.maNV) qb.andWhere('nv.maNV = :maNV', { maNV: query.maNV });
    if (query.hoTen)
      qb.andWhere('nv.hoTen LIKE :hoTen', { hoTen: `%${query.hoTen}%` });
    if (query.tenCa)
      qb.andWhere('ca.tenCa LIKE :tenCa', { tenCa: `%${query.tenCa}%` });
    if (query.trangThai)
      qb.andWhere('cc.trangThai = :trangThai', { trangThai: query.trangThai });
    if (query.tuNgay)
      qb.andWhere('cc.gioVao >= :tuNgay', { tuNgay: new Date(query.tuNgay) });
    if (query.denNgay)
      qb.andWhere('cc.gioVao <= :denNgay', { denNgay: new Date(query.denNgay) });
    const list = await qb.orderBy('cc.gioVao', 'DESC').getMany();
    return list.map((c) => ({
      ...c,
      ...this.tinhThongTinCong(c),
      trangThaiText: this.mapTrangThai(c.trangThai),
    }));
  }

  async getMyRecords(maNV: number, query: { trangThai?: string; tuNgay?: string; denNgay?: string; }) {
    const qb = this.chamCongRepo
      .createQueryBuilder('cc')
      .leftJoinAndSelect('cc.nhanVien', 'nv')
      .leftJoinAndSelect('cc.caLamViec', 'ca');
    qb.where('nv.maNV = :maNV', { maNV });
    if (query.trangThai) {
      qb.andWhere('cc.trangThai = :trangThai', { trangThai: query.trangThai });
    }
    if (query.tuNgay) {
      qb.andWhere('cc.gioVao >= :tuNgay', { tuNgay: new Date(query.tuNgay) });
    }
    if (query.denNgay) {
      qb.andWhere('cc.gioVao <= :denNgay', { denNgay: new Date(query.denNgay) });
    }
    const list = await qb.orderBy('cc.gioVao', 'DESC').getMany();
    return list.map((c) => ({
      ...c,
      ...this.tinhThongTinCong(c),
      trangThaiText: this.mapTrangThai(c.trangThai),
    }));
  }
  
  async update(id: number, updateData: Partial<ChamCong>) {
    const chamCong = await this.chamCongRepo.findOneBy({ maCC: id });
    if (!chamCong) throw new NotFoundException('Không tìm thấy bản ghi');
    Object.assign(chamCong, updateData);
    return this.chamCongRepo.save(chamCong);
  }

  async remove(id: number) {
    const chamCong = await this.chamCongRepo.findOneBy({ maCC: id });
    if (!chamCong) throw new NotFoundException('Không tìm thấy bản ghi');
    await this.chamCongRepo.remove(chamCong);
    return { deleted: true };
  }
}
