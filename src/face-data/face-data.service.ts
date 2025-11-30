import { Injectable, NotFoundException, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FaceData } from './entities/face-data.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { CaLamViec } from 'src/calamviec/entities/calamviec.entity';

// --- IMPORT THƯ VIỆN AI ---
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import * as path from 'path';

const canvas = require('canvas');
const { Canvas, Image, ImageData, loadImage } = canvas;
// --- CẤU HÌNH MÔI TRƯỜNG ---
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

@Injectable()
export class FaceDataService implements OnModuleInit {
  // 👇 Biến kiểm tra model đã load chưa
  private modelsLoaded = false;

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

  /** 1. Tự động load Model khi Server khởi động */
  async onModuleInit() {
    await this.loadModels();
  }

  private async loadModels() {
    if (this.modelsLoaded) return;
    const MODEL_URL = path.join(process.cwd(), 'models');
    try {
      console.log('⏳ Đang tải Face Models...');
      await tf.ready();
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL),
      ]);
      this.modelsLoaded = true;
      console.log('✅ Face Models đã tải xong!');
    } catch (error) {
      console.error('❌ Lỗi tải Face Models:', error);
    }
  }

  /** 2. Hàm phụ trợ: Chuyển ảnh Base64 -> Vector khuôn mặt */
  private async processImageToDescriptor(imageBase64: string): Promise<Float32Array> {
    if (!this.modelsLoaded) await this.loadModels();
    try {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, 'base64');
      const img = await loadImage(imgBuffer);

      const detection = await faceapi
        .detectSingleFace(img as any)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new BadRequestException('Không tìm thấy khuôn mặt trong ảnh.');
      }
      return detection.descriptor;
    } catch (error) {
      console.error("AI Error:", error);
      throw new BadRequestException('Lỗi xử lý hình ảnh: ' + (error.message || error));
    }
  }

  /** 3. API MỚI: Đăng ký từ Mobile */
  async registerFaceFromMobile(maNV: number, imageBase64: string) {
    const descriptorFloat32 = await this.processImageToDescriptor(imageBase64);
    const faceDescriptor = Array.from(descriptorFloat32); 
    // Gọi lại hàm cũ để lưu vào DB
    return this.registerFace(maNV, faceDescriptor);
  }

  /** 4. API MỚI: Chấm công từ Mobile (So sánh 1:1 rồi chấm công) */
  async pointFaceMobile(maNV: number, imageBase64: string, maCa: number) {
    // A. Xác thực khuôn mặt
    const storedFace = await this.fdRepo.findOne({ where: { nhanVien: { maNV } } });
    if (!storedFace) throw new BadRequestException('Bạn chưa đăng ký khuôn mặt.');

    const currentDescriptor = await this.processImageToDescriptor(imageBase64);
    const distance = this.euclideanDistance(Array.from(currentDescriptor), storedFace.faceDescriptor);
    
    if (distance > 0.55) { 
      throw new BadRequestException('Khuôn mặt không khớp. Vui lòng thử lại.');
    }

    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Nhân viên không tồn tại');

    const ca = await this.caRepo.findOne({ where: { maCa } });
    if (!ca) throw new NotFoundException('Ca làm việc không tồn tại');

    const { startUTC, endUTC } = this.getTodayRangeUTC();

    let record = await this.chamCongRepo.findOne({
      where: { nhanVien: { maNV }, gioVao: Between(startUTC, endUTC) },
      relations: ['nhanVien', 'caLamViec'],
    });

    if (!record) {
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
      const now = this.getVietnamTime();
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

  //  Giờ Việt Nam
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
      return 1.0; 
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
        faceDescriptor,
      });
    } else {
      fd.faceDescriptor = faceDescriptor;
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
    const threshold = 0.6; // Có thể giảm xuống 0.55 nếu muốn khắt khe hơn

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