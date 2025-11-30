import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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

  // --- CÁC HÀM TIỆN ÍCH THỜI GIAN ---
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

  // --- THUẬT TOÁN SO SÁNH ---
  /** Tính khoảng cách Euclidean giữa 2 vector */
  private euclideanDistance(desc1: number[], desc2: number[]): number {
    if (desc1.length !== desc2.length) {
      // throw new Error('Face descriptors must have the same length');
      return 1.0; 
    }
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /** Nhận diện nhân viên từ vector (So sánh với toàn bộ DB) */
  private async detectEmployee(faceDescriptor: number[]): Promise<number | null> {
    const allFaceData = await this.fdRepo.find({ relations: ['nhanVien'] });
    const threshold = 0.6; // Ngưỡng sai số

    for (const fd of allFaceData) {
      try {
        const storedDescriptor: number[] = fd.faceDescriptor;
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

  // --- CÁC CHỨC NĂNG CHÍNH ---

  /** Đăng ký FaceID (Nhận mảng số) */
  async registerFace(maNV: number, faceDescriptor: number[]) {
    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Nhân viên không tồn tại');

    let fd = await this.fdRepo.findOne({ where: { nhanVien: { maNV } } });

    if (!fd) {
      fd = this.fdRepo.create({
        nhanVien: nv,
        faceDescriptor,
      });
    } else {
      fd.faceDescriptor = faceDescriptor;
    }

    await this.fdRepo.save(fd);
    return { message: 'Đăng ký FaceID thành công' };
  }

  /** Chấm công (Nhận mảng số) */
  async pointFace(faceDescriptor: number[], maCa: number) {
    // 1. Tìm ra ai đang chấm công
    const maNV = await this.detectEmployee(faceDescriptor);
    if (!maNV) throw new NotFoundException('Không nhận diện được nhân viên');

    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Nhân viên không tồn tại');

    const ca = await this.caRepo.findOne({ where: { maCa } });
    if (!ca) throw new NotFoundException('Ca làm việc không tồn tại');

    const { startUTC, endUTC } = this.getTodayRangeUTC();

    // 2. Tìm bản ghi chấm công hôm nay
    let record = await this.chamCongRepo.findOne({
      where: { nhanVien: { maNV }, gioVao: Between(startUTC, endUTC) },
      relations: ['nhanVien', 'caLamViec'],
    });

    // 3. Logic Check-in / Check-out
    if (!record) {
      // Check-in
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
      // Check-out
      const now = this.getVietnamTime();
      // Chặn spam (phải cách 1 phút)
      if (now.getTime() - record.gioVao.getTime() < 60000) {
         return { message: '⏳ Vui lòng đợi 1 phút sau khi check-in', type: 'warn' };
      }

      record.gioRa = now;
      const diffMs = record.gioRa.getTime() - record.gioVao.getTime();
      record.soGioLam = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      record.trangThai = 'hop-le';
      await this.chamCongRepo.save(record);
      return { message: '✅ Check-out thành công', type: 'checkout' };
    }

    return { message: 'Hôm nay đã hoàn tất chấm công', type: 'done' };
  }

  // --- CÁC HÀM CRUD KHÁC ---

  async checkFace(maNV: number) {
    const fd = await this.fdRepo.findOne({ where: { nhanVien: { maNV } } });
    return { hasFace: !!fd };
  }

  async getAll() {
    return this.fdRepo.find({ relations: ['nhanVien'] });
  }

  async getByNhanVien(maNV: number) {
    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException(`Không tìm thấy nhân viên ${maNV}`);
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
}