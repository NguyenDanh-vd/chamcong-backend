import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { FaceData } from './entities/face-data.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { CaLamViec } from 'src/calamviec/entities/calamviec.entity';

@Injectable()
export class FaceDataService {
  constructor(
    @InjectRepository(FaceData)
    private fdRepo: Repository<FaceData>,

    @InjectRepository(NhanVien)
    private nvRepo: Repository<NhanVien>,

    @InjectRepository(ChamCong)
    private chamCongRepo: Repository<ChamCong>,

    @InjectRepository(CaLamViec)
    private caRepo: Repository<CaLamViec>,
  ) {}

  // ⚡️ Giờ Việt Nam
  private getVietnamTime(date = new Date()) {
    const vnOffsetMs = 7 * 60 * 60 * 1000;
    return new Date(date.getTime() + vnOffsetMs);
  }

  private getTodayRangeUTC() {
    const vnNow = this.getVietnamTime();
    const startVN = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate(), 0, 0, 0);
    const endVN = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate(), 23, 59, 59);
    const vnOffsetMs = 7 * 60 * 60 * 1000;
    return {
      startUTC: new Date(startVN.getTime() - vnOffsetMs),
      endUTC: new Date(endVN.getTime() - vnOffsetMs),
    };
  }

  /** Tính khoảng cách Euclidean */
  private euclideanDistance(desc1: number[], desc2: number[]): number {
    if (desc1.length !== desc2.length) {
      throw new Error('Face descriptors must have the same length');
    }
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /** Đăng ký hoặc cập nhật FaceID */
  async registerFace(maNV: number, faceDescriptor: number[]) {
    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Nhân viên không tồn tại');

    let fd = await this.fdRepo.findOne({ where: { nhanVien: { maNV } } });

    if (!fd) {
      fd = this.fdRepo.create({
        nhanVien: nv,
        faceDescriptor: JSON.stringify(faceDescriptor),
      });
    } else {
      fd.faceDescriptor = JSON.stringify(faceDescriptor);
    }

    await this.fdRepo.save(fd);
    return { message: 'Đăng ký FaceID thành công' };
  }

  /** Kiểm tra nhân viên đã có FaceID chưa */
  async checkFace(maNV: number) {
    const fd = await this.fdRepo.findOne({ where: { nhanVien: { maNV } } });
    return { hasFace: !!fd };
  }

  /** Nhận diện khuôn mặt → trả về maNV nếu khớp */
  private async detectEmployee(faceDescriptor: number[]): Promise<number | null> {
    const allFaceData = await this.fdRepo.find({ relations: ['nhanVien'] });
    const threshold = 0.6;

    for (const fd of allFaceData) {
      try {
        const storedDescriptor: number[] = JSON.parse(fd.faceDescriptor);
        const distance = this.euclideanDistance(faceDescriptor, storedDescriptor);
        if (distance < threshold) {
          return fd.nhanVien.maNV;
        }
      } catch (e) {
        console.error('Error parsing faceDescriptor:', e);
      }
    }
    return null;
  }

  /** API chấm công bằng khuôn mặt duy nhất */
  async pointFace(faceDescriptor: number[], maCa: number) {
    const maNV = await this.detectEmployee(faceDescriptor);
    if (!maNV) throw new NotFoundException('Không nhận diện được nhân viên');

    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Nhân viên không tồn tại');

    const ca = await this.caRepo.findOne({ where: { maCa } });
    if (!ca) throw new NotFoundException('Ca làm việc không tồn tại');

    const { startUTC, endUTC } = this.getTodayRangeUTC();

    // Kiểm tra đã check-in chưa
    let record = await this.chamCongRepo.findOne({
      where: { nhanVien: { maNV }, gioVao: Between(startUTC, endUTC) },
      relations: ['nhanVien', 'caLamViec'],
    });

    if (!record) {
      // Chưa check-in → tạo mới
      record = this.chamCongRepo.create({
        nhanVien: nv,
        caLamViec: ca,
        gioVao: this.getVietnamTime(),
        trangThai: 'chua-xac-nhan',
        hinhThuc: 'faceid',
      });
      await this.chamCongRepo.save(record);
      return { message: '✅ Check-in thành công', type: 'checkin' };
    }

    if (!record.gioRa) {
      // Đã check-in nhưng chưa check-out → cập nhật giờ ra
      const now = this.getVietnamTime();
      record.gioRa = now;
      const diffMs = record.gioRa.getTime() - record.gioVao.getTime();
      record.soGioLam = Math.floor(diffMs / (1000 * 60 * 60));
      record.trangThai = 'hop-le';
      await this.chamCongRepo.save(record);
      return { message: '✅ Check-out thành công', type: 'checkout' };
    }

    return { message: 'Hôm nay đã hoàn tất chấm công', type: 'done' };
  }

  /** Lấy toàn bộ dữ liệu FaceID */
  async getAll() {
    return this.fdRepo.find({ relations: ['nhanVien'] });
  }

  /** Lấy dữ liệu FaceID theo mã nhân viên */
  async getByNhanVien(maNV: number) {
    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) {
      throw new NotFoundException(`Không tìm thấy nhân viên ${maNV}`);
    }

    return this.fdRepo.find({
      where: { nhanVien: { maNV } },
      relations: ['nhanVien'],
    });
  }

  async removeByNhanVien(maNV: number) {
    await this.fdRepo.delete({ nhanVien: { maNV } });
    return { message: `Đã xóa toàn bộ faceData của nhân viên ${maNV}` };
  }

  async remove(id: number) {
    const fd = await this.fdRepo.findOne({ where: { id } });
    if (!fd) throw new NotFoundException('FaceData không tồn tại');
    await this.fdRepo.remove(fd);
    return { message: `Đã xóa faceData id=${id}` };
  }

  /** Lấy bản ghi chấm công hôm nay */
  async getTodayRecord(maNV: number): Promise<ChamCong | null> {
    const { startUTC, endUTC } = this.getTodayRangeUTC();

    return this.chamCongRepo.findOne({
      where: {
        nhanVien: { maNV },
        gioVao: Between(startUTC, endUTC),
      },
      relations: ['nhanVien', 'caLamViec'],
    });
  }

  /** Trạng thái hôm nay */
  async getTodayStatus(maNV: number): Promise<{
    daCheckIn: boolean;
    daCheckOut: boolean;
    gioVao?: Date;
    gioRa?: Date;
  }> {
    const record = await this.getTodayRecord(maNV);
    const vnOffsetMs = 7 * 60 * 60 * 1000;

    if (!record) {
      return {
        daCheckIn: false,
        daCheckOut: false,
      };
    }

    return {
      daCheckIn: true,
      daCheckOut: !!record.gioRa,
      gioVao: new Date(record.gioVao.getTime() + vnOffsetMs),
      gioRa: record.gioRa ? new Date(record.gioRa.getTime() + vnOffsetMs) : undefined,
    };
  }
}
