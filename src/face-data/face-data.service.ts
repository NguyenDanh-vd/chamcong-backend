import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FaceData } from './entities/face-data.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { CaLamViec } from 'src/calamviec/entities/calamviec.entity';

// --- 1. IMPORT THƯ VIỆN AI (BẮT BUỘC CHO MOBILE) ---
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import * as path from 'path';
import { Canvas, Image, ImageData, loadImage } from 'canvas';

// Cấu hình môi trường Node.js cho face-api
faceapi.env.monkeyPatch({
  Canvas: Canvas as unknown as {
    new (): HTMLCanvasElement;
    prototype: HTMLCanvasElement;
  },
  Image: Image as unknown as {
    new (): HTMLImageElement;
    prototype: HTMLImageElement;
  },
  ImageData: ImageData as unknown as {
    new (
      sw: number,
      sh: number,
      settings?: ImageDataSettings,
    ): globalThis.ImageData;
    new (
      data: Uint8ClampedArray,
      sw: number,
      sh?: number,
      settings?: ImageDataSettings,
    ): globalThis.ImageData;
    prototype: globalThis.ImageData;
  },
});

@Injectable()
export class FaceDataService implements OnModuleInit {
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

  // --- 2. LOAD MODEL KHI SERVER CHẠY ---
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
        faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL),
      ]);
      this.modelsLoaded = true;
      console.log('✅ Face Models đã tải xong!');
    } catch (error) {
      console.error('❌ Lỗi tải Face Models:', error);
    }
  }

  // --- 3. HÀM XỬ LÝ ẢNH (MOBILE / WEB) ---
  private async processImageToDescriptor(
    imageBase64: string,
  ): Promise<Float32Array> {
    if (!this.modelsLoaded) await this.loadModels();
    try {
      const base64Data = imageBase64.replace(
        /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
        '',
      );
      const imgBuffer = Buffer.from(base64Data, 'base64');
      const img = await loadImage(imgBuffer);

      let detection = await faceapi
        .detectSingleFace(
          img as unknown as HTMLImageElement,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.35,
          }),
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      // Fallback nếu ảnh nhỏ hoặc ánh sáng yếu
      if (!detection) {
        detection = await faceapi
          .detectSingleFace(
            img as unknown as HTMLImageElement,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.25,
            }),
          )
          .withFaceLandmarks()
          .withFaceDescriptor();
      }

      if (!detection) {
        throw new BadRequestException(
          'Không tìm thấy khuôn mặt rõ ràng trong ảnh. Vui lòng nhìn thẳng vào camera ở nơi đủ sáng.',
        );
      }
      return detection.descriptor;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('AI Error:', error);
      throw new BadRequestException('Lỗi xử lý hình ảnh khuôn mặt.');
    }
  }

  // --- 4. API CHO MOBILE & WEB ---

  // Đăng ký 1 ảnh
  async registerFaceFromMobile(maNV: number, imageBase64: string) {
    const descriptorFloat32 = await this.processImageToDescriptor(imageBase64);
    const faceDescriptor = Array.from(descriptorFloat32);
    return this.registerFace(maNV, faceDescriptor);
  }

  // Đăng ký nhiều ảnh (multi-angle)
  async registerFaceFromMobileMultiple(maNV: number, imagesBase64: string[]) {
    if (!Array.isArray(imagesBase64) || imagesBase64.length === 0) {
      throw new BadRequestException('Vui lòng chụp ít nhất 1 ảnh khuôn mặt.');
    }

    const descriptors: Float32Array[] = [];
    let failedCount = 0;

    for (const img of imagesBase64) {
      try {
        const desc = await this.processImageToDescriptor(img);
        descriptors.push(desc);
      } catch {
        failedCount += 1;
      }
    }

    const minRequired = imagesBase64.length >= 3 ? 2 : 1;
    if (descriptors.length < minRequired) {
      throw new BadRequestException(
        `Không nhận diện đủ ảnh khuôn mặt hợp lệ (Thành công: ${descriptors.length}/${imagesBase64.length}). Vui lòng giữ mặt trong khung hình và đủ ánh sáng.`,
      );
    }

    // Average the valid descriptors
    const avgDescriptor = this.averageDescriptors(descriptors);
    const faceDescriptor = Array.from(avgDescriptor);
    return this.registerFace(maNV, faceDescriptor);
  }

  // Chấm công từ Mobile
  async pointFaceMobile(maNV: number, imageBase64: string, maCa?: number) {
    const storedFace = await this.fdRepo.findOne({
      where: { nhanVien: { maNV } },
    });
    if (!storedFace)
      throw new BadRequestException('Bạn chưa đăng ký khuôn mặt.');

    const currentDescriptor = await this.processImageToDescriptor(imageBase64);
    const distance = this.euclideanDistance(
      Array.from(currentDescriptor),
      storedFace.faceDescriptor,
    );

    // Nới lỏng ngưỡng so sánh lên 0.65 để dễ chấm công hơn trên điện thoại
    if (distance > 0.65) {
      throw new BadRequestException('Khuôn mặt không khớp. Vui lòng thử lại.');
    }

    return this.pointFaceLogic(maNV, maCa);
  }

  // --- 5. LOGIC CHUNG & CŨ ---

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
    const [h, m, s] = (timeStr || '08:00:00').split(':').map(Number);
    const d = new Date(refDate);
    d.setHours(h || 0, m || 0, s || 0, 0);
    return d;
  }

  private normalizeDescriptor(raw: unknown): number[] {
    if (!raw) return [];
    let parsed: unknown = raw;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return [];
      }
    }
    if (Array.isArray(parsed)) {
      return parsed.map(Number);
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.values(parsed).map(Number);
    }
    return [];
  }

  private averageDescriptors(descriptors: Float32Array[]): Float32Array {
    if (descriptors.length === 0) throw new BadRequestException('No descriptors');
    const length = descriptors[0].length;
    const avg = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (const desc of descriptors) {
        sum += desc[i];
      }
      avg[i] = sum / descriptors.length;
    }
    return avg;
  }

  private euclideanDistance(desc1: number[], desc2: unknown): number {
    const normalized2 = this.normalizeDescriptor(desc2);
    if (!desc1 || desc1.length !== normalized2.length || desc1.length === 0)
      return 1.0;
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      sum += Math.pow(desc1[i] - normalized2[i], 2);
    }
    return Math.sqrt(sum);
  }

  // Logic lưu DB (Đồng bộ hoàn toàn với ChamcongService)
  private async pointFaceLogic(maNV: number, maCa?: number) {
    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Nhân viên không tồn tại');

    let ca: CaLamViec | null = null;
    if (maCa) {
      ca = await this.caRepo.findOne({ where: { maCa } });
    } else {
      ca = await this.caRepo.findOne({ where: { trangThai: true } });
    }
    if (!ca)
      throw new BadRequestException(
        'Hiện tại không có ca làm việc nào đang hoạt động',
      );

    const { startOfDay, endOfDay } = this.getTodayRangeInVietnam();

    let record = await this.chamCongRepo.findOne({
      where: { nhanVien: { maNV }, gioVao: Between(startOfDay, endOfDay) },
      relations: ['nhanVien', 'caLamViec'],
    });

    if (!record) {
      const gioVao = new Date();
      const gioBatDau = this.parseShiftTime(ca.gioBatDau, gioVao);
      const trangThai = gioVao > gioBatDau ? 'di-tre' : 'hop-le';

      record = this.chamCongRepo.create({
        nhanVien: nv,
        caLamViec: ca,
        gioVao,
        trangThai,
        hinhThuc: 'faceid',
      });
      await this.chamCongRepo.save(record);
      return { message: '✅ Check-in thành công', type: 'checkin' };
    }

    if (!record.gioRa) {
      const now = new Date();
      if (now.getTime() - new Date(record.gioVao).getTime() < 60 * 1000) {
        return {
          message: 'Đã Check-in rồi. Vui lòng đợi 1 phút trước khi Check-out.',
          type: 'ignored',
        };
      }
      record.gioRa = now;
      const gioKetThuc = this.parseShiftTime(
        record.caLamViec?.gioKetThuc || ca.gioKetThuc,
        record.gioRa,
      );

      if (record.trangThai === 'di-tre' && record.gioRa < gioKetThuc) {
        record.trangThai = 'tre-va-ve-som';
      } else if (record.gioRa < gioKetThuc) {
        record.trangThai = 've-som';
      } else if (record.trangThai !== 'di-tre') {
        record.trangThai = 'hop-le';
      }

      const diffMs =
        record.gioRa.getTime() - new Date(record.gioVao).getTime();
      record.soGioLam = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      await this.chamCongRepo.save(record);
      return { message: '✅ Check-out thành công', type: 'checkout' };
    }

    return { message: 'Hôm nay đã hoàn tất chấm công', type: 'done' };
  }

  // API Cũ (Cho Web)
  async registerFace(maNV: number, faceDescriptor: number[]) {
    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Nhân viên không tồn tại');

    let fd = await this.fdRepo.findOne({ where: { nhanVien: { maNV } } });
    if (!fd) {
      fd = this.fdRepo.create({ nhanVien: nv, faceDescriptor });
    } else {
      fd.faceDescriptor = faceDescriptor;
    }
    await this.fdRepo.save(fd);
    return { message: 'Đăng ký FaceID thành công', hasFace: true };
  }

  async pointFace(faceDescriptor: number[], maCa: number) {
    const maNV = await this.detectEmployee(faceDescriptor);
    if (!maNV) throw new NotFoundException('Không nhận diện được nhân viên');
    return this.pointFaceLogic(maNV, maCa);
  }

  private async detectEmployee(
    faceDescriptor: number[],
  ): Promise<number | null> {
    const allFaceData = await this.fdRepo.find({
      select: ['id', 'maNV', 'faceDescriptor'],
    });
    const threshold = 0.65; // Nới lỏng ngưỡng

    for (const fd of allFaceData) {
      try {
        const distance = this.euclideanDistance(
          faceDescriptor,
          fd.faceDescriptor,
        );
        if (distance < threshold) return fd.maNV;
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  }

  // Helper CRUD
  async checkFace(maNV: number) {
    const count = await this.fdRepo.count({ where: { maNV } });
    return { hasFace: count > 0 };
  }
  async getAll() {
    return this.fdRepo.find({
      select: ['id', 'maNV', 'ngayTao'],
    });
  }
  async getByNhanVien(maNV: number) {
    return this.fdRepo.find({
      where: { maNV },
      select: ['id', 'maNV', 'ngayTao'],
    });
  }
  async removeByNhanVien(maNV: number) {
    await this.fdRepo.delete({ maNV });
    return { message: `Đã xóa FaceID` };
  }
  async remove(id: number) {
    await this.fdRepo.delete(id);
    return { message: `Đã xóa` };
  }

  /** 1. Tìm xem ảnh này là của nhân viên nào (Dùng cho Login - So sánh 1:N) */
  async identifyUserFromImage(imageBase64: string): Promise<number | null> {
    // 1. Chuyển ảnh Base64 thành vector (Descriptor)
    const descriptor = await this.processImageToDescriptor(imageBase64);

    const allFaces = await this.fdRepo.find({
      select: ['id', 'maNV', 'faceDescriptor'],
    });

    let bestMatch: { maNV: number; distance: number } | null = null;
    const threshold = 0.6;

    for (const face of allFaces) {
      const dist = this.euclideanDistance(
        Array.from(descriptor),
        face.faceDescriptor,
      );

      if (dist < threshold) {
        if (!bestMatch || dist < bestMatch.distance) {
          bestMatch = { maNV: face.maNV, distance: dist };
        }
      }
    }

    return bestMatch ? bestMatch.maNV : null;
  }
}
