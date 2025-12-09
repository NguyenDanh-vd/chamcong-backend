import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChamCong } from './entities/chamcong.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { CaLamViec } from 'src/calamviec/entities/calamviec.entity';

// Import các DTO và Service liên quan
import { CreateChamCongDto } from './dto/create-chamcong.dto';
import { CalamviecService } from 'src/calamviec/calamviec.service';

// Định nghĩa DTO ngay tại đây hoặc import từ file dto
export interface PointFaceDto {
  maNV: number;
  maCa?: number;
  faceDescriptor: number[]; // Vector khuôn mặt gửi từ Frontend (128 floats)
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

  // 1. Lấy khoảng thời gian bắt đầu và kết thúc ngày theo giờ VN
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

  // 2. Parse chuỗi giờ (HH:mm:ss) thành Date
  private parseShiftTime(timeStr: string, refDate: Date): Date {
    const [h, m, s] = timeStr.split(':').map(Number);
    const d = new Date(refDate);
    d.setHours(h, m, s, 0);
    return d;
  }

  // 3. Map mã trạng thái sang tiếng Việt
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

  // 4. Tính toán thông tin công (đi trễ, về sớm)
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
        (chamCong.gioRa.getTime() - chamCong.gioVao.getTime()) /
        (1000 * 60 * 60);
    }
    return { soPhutDiTre, soPhutVeSom, soGioLam };
  }

  // 5. Tính khoảng cách giữa 2 tọa độ (Haversine Formula) - Trả về mét
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Bán kính trái đất (mét)
    const toRad = (val: number) => (val * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 6. Tính khoảng cách Euclidean giữa 2 vector khuôn mặt
  private getEuclideanDistance(face1: number[], face2: number[]): number {
    if (!face1 || !face2 || face1.length !== face2.length) return 1.0; 
    const sum = face1.reduce(
      (acc, val, i) => acc + Math.pow(val - face2[i], 2),
      0,
    );
    return Math.sqrt(sum);
  }

  // =================================================================
  // CÁC HÀM NGHIỆP VỤ CHÍNH
  // =================================================================

  async checkIn({ maNV, maCa }: { maNV: number; maCa?: number }): Promise<ChamCong> {
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

    if (existing)
      throw new BadRequestException('Nhân viên đã check-in hôm nay');

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
      (chamCong.gioRa.getTime() - chamCong.gioVao.getTime()) /
      (1000 * 60 * 60);

    return this.chamCongRepo.save(chamCong);
  }

  // --- HÀM QUAN TRỌNG: CHẤM CÔNG BẰNG KHUÔN MẶT ---
  async pointWithFace(body: PointFaceDto) {
    const { maNV, maCa, latitude, longitude, faceDescriptor } = body;

    // A. Kiểm tra cấu hình & vị trí GPS
    const latStr = this.configService.get<string>('COMPANY_LATITUDE');
    const lonStr = this.configService.get<string>('COMPANY_LONGITUDE');
    const radiusStr = this.configService.get<string>('ALLOWED_CHECKIN_RADIUS_METERS');

    if (!latStr || !lonStr || !radiusStr) {
      throw new BadRequestException(
        'Server chưa cấu hình tọa độ công ty (COMPANY_LATITUDE, ...)',
      );
    }

    const companyLat = parseFloat(latStr);
    const companyLon = parseFloat(lonStr);
    const allowedRadius = parseInt(radiusStr, 10);

    const distance = this.calculateDistance(
      latitude,
      longitude,
      companyLat,
      companyLon,
    );

    if (distance > allowedRadius) {
      throw new BadRequestException(
        `Bạn đang ở ngoài vùng chấm công. Khoảng cách: ${Math.round(distance)}m (Cho phép: ${allowedRadius}m).`,
      );
    }

    // B. Kiểm tra nhân viên
    const nhanVien = await this.nhanVienRepo.findOneBy({ maNV: maNV });
    if (!nhanVien) throw new NotFoundException('Không tìm thấy nhân viên');

    // C. Kiểm tra khớp khuôn mặt (Face Matching)
    // Lưu ý: Đảm bảo entity NhanVien có trường 'faceData' chứa dữ liệu vector
    if (!nhanVien.faceData) {
      throw new BadRequestException('Nhân viên chưa đăng ký dữ liệu khuôn mặt');
    }

    let savedFaceVector: number[];
    try {
      // Nếu lưu trong DB là chuỗi JSON thì parse, nếu là object/array thì dùng luôn
      savedFaceVector = typeof nhanVien.faceData === 'string'
        ? JSON.parse(nhanVien.faceData)
        : nhanVien.faceData;
    } catch (e) {
      throw new BadRequestException('Dữ liệu khuôn mặt trong hệ thống bị lỗi');
    }

    const diff = this.getEuclideanDistance(faceDescriptor, savedFaceVector);
    const THRESHOLD = 0.5; // Ngưỡng chính xác (0.45 - 0.55 là tốt)

    if (diff > THRESHOLD) {
      throw new BadRequestException('Khuôn mặt không khớp với dữ liệu hệ thống.');
    }

    // D. Xử lý Check-in / Check-out
    const { startOfDay, endOfDay } = this.getTodayRangeInVietnam();
    const existing = await this.chamCongRepo.findOne({
      where: {
        nhanVien: { maNV: maNV },
        gioVao: Between(startOfDay, endOfDay),
      },
    });

    if (!existing) {
      const record = await this.checkIn({ maNV: maNV, maCa: maCa });
      return { action: 'checkin', message: 'Check-in thành công', data: record };
    }

    if (!existing.gioRa) {
      // Chặn spam check-out: Phải cách check-in ít nhất 1 phút
      const now = new Date();
      const diffMs = now.getTime() - existing.gioVao.getTime();
      const minMinutes = 1; 

      if (diffMs < minMinutes * 60 * 1000) {
         throw new BadRequestException(
           `Bạn vừa check-in. Vui lòng chờ ${minMinutes} phút để check-out.`
         );
      }

      const record = await this.checkOut(maNV);
      return { action: 'checkout', message: 'Check-out thành công', data: record };
    }

    throw new BadRequestException('Hôm nay đã hoàn tất chấm công.');
  }

  // --- CÁC HÀM GET DỮ LIỆU KHÁC (GIỮ NGUYÊN) ---
  
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
      throw new BadRequestException('Lỗi khi lấy dữ liệu chấm công hôm nay');
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

  async getMyRecords(maNV: number, query: { trangThai?: string; tuNgay?: string; denNgay?: string }) {
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

  async getThongKe(maNV: number) {
    // 1. Lấy danh sách chấm công của nhân viên này
    const list = await this.chamCongRepo.find({
      where: { nhanVien: { maNV } },
      relations: ['caLamViec'],
    });

    // 2. Tính toán đơn giản
    const tongSoNgay = list.length;
    const soNgayDiTre = list.filter((x) => x.trangThai === 'di-tre').length;
    const soNgayVeSom = list.filter((x) => x.trangThai === 've-som').length;
    const soNgayHopLe = list.filter((x) => x.trangThai === 'hop-le').length;

    // 3. Trả về kết quả
    return {
      maNV,
      tongSoNgay,
      soNgayDiTre,
      soNgayVeSom,
      soNgayHopLe,
      chiTiet: list 
    };
  }
}