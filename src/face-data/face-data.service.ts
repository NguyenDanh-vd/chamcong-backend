import { Injectable, NotFoundException, OnModuleInit, BadRequestException } from '@nestjs/common';
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

// Cấu hình môi trường Node.js cho face-api
const canvas = require('canvas');
const { Canvas, Image, ImageData, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

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

  // --- 3. HÀM XỬ LÝ ẢNH (MOBILE) ---
  private async processImageToDescriptor(imageBase64: string): Promise<Float32Array> {
    if (!this.modelsLoaded) await this.loadModels();
    try {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, 'base64');
      const img = await loadImage(imgBuffer);

      const detection = await faceapi
        .detectSingleFace(img as any, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new BadRequestException('Không tìm thấy khuôn mặt trong ảnh.');
      }
      return detection.descriptor;
    } catch (error) {
      console.error("AI Error:", error);
      throw new BadRequestException('Lỗi xử lý hình ảnh.');
    }
  }

  // --- 4. API CHO MOBILE (QUAN TRỌNG) ---
  
  // Đăng ký từ Mobile
  async registerFaceFromMobile(maNV: number, imageBase64: string) {
    const descriptorFloat32 = await this.processImageToDescriptor(imageBase64);
    const faceDescriptor = Array.from(descriptorFloat32);
    return this.registerFace(maNV, faceDescriptor);
  }

  // Chấm công từ Mobile
  async pointFaceMobile(maNV: number, imageBase64: string, maCa: number) {
    const storedFace = await this.fdRepo.findOne({ where: { nhanVien: { maNV } } });
    if (!storedFace) throw new BadRequestException('Bạn chưa đăng ký khuôn mặt.');

    const currentDescriptor = await this.processImageToDescriptor(imageBase64);
    const distance = this.euclideanDistance(Array.from(currentDescriptor), storedFace.faceDescriptor);
    
    // Nới lỏng ngưỡng so sánh lên 0.65 để dễ chấm công hơn trên điện thoại
    if (distance > 0.65) { 
      throw new BadRequestException('Khuôn mặt không khớp. Vui lòng thử lại.');
    }

    return this.pointFaceLogic(maNV, maCa);
  }

  // --- 5. LOGIC CHUNG & CŨ ---

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

  private euclideanDistance(desc1: number[], desc2: number[]): number {
    if (desc1.length !== desc2.length) return 1.0; 
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
  }

  // Logic lưu DB (Tách ra để dùng chung)
  private async pointFaceLogic(maNV: number, maCa: number) {
    const nv = await this.nvRepo.findOne({ where: { maNV } });
    if (!nv) throw new NotFoundException('Nhân viên không tồn tại'); // Đã check kỹ

    const ca = await this.caRepo.findOne({ where: { maCa } });
    if (!ca) throw new NotFoundException('Ca làm việc không tồn tại');

    const { startUTC, endUTC } = this.getTodayRangeUTC();

    let record = await this.chamCongRepo.findOne({
      where: { nhanVien: { maNV }, gioVao: Between(startUTC, endUTC) },
      relations: ['nhanVien', 'caLamViec'],
    });

    if (!record) {
      record = this.chamCongRepo.create({
        nhanVien: nv as NhanVien, // Ép kiểu để tránh lỗi đỏ
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
      if (now.getTime() - record.gioVao.getTime() < 300000) { 
         return { message: 'Đã Check-in rồi. Vui lòng quay lại sau.', type: 'ignored' }; 
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

  private async detectEmployee(faceDescriptor: number[]): Promise<number | null> {
    const allFaceData = await this.fdRepo.find({ relations: ['nhanVien'] });
    const threshold = 0.65; // Nới lỏng ngưỡng

    for (const fd of allFaceData) {
      try {
        const distance = this.euclideanDistance(faceDescriptor, fd.faceDescriptor);
        if (distance < threshold) return fd.nhanVien.maNV;
      } catch (e) { console.error(e); }
    }
    return null;
  }

  // Helper CRUD
  async checkFace(maNV: number) { const fd = await this.fdRepo.findOne({ where: { nhanVien: { maNV } } }); return { hasFace: !!fd }; }
  async getAll() { return this.fdRepo.find({ relations: ['nhanVien'] }); }
  async getByNhanVien(maNV: number) { return this.fdRepo.find({ where: { nhanVien: { maNV } }, relations: ['nhanVien'] }); }
  async removeByNhanVien(maNV: number) { await this.fdRepo.delete({ nhanVien: { maNV } }); return { message: `Đã xóa FaceID` }; }
  async remove(id: number) { await this.fdRepo.delete(id); return { message: `Đã xóa` }; }

  /** 1. Tìm xem ảnh này là của nhân viên nào (Dùng cho Login - So sánh 1:N) */
  async identifyUserFromImage(imageBase64: string): Promise<number | null> {
    // 1. Chuyển ảnh Base64 thành vector (Descriptor)
    const descriptor = await this.processImageToDescriptor(imageBase64);
    
    const allFaces = await this.fdRepo.find({ relations: ['nhanVien'] });
    
    let bestMatch: { maNV: number; distance: number } | null = null;
    const threshold = 0.6; 

    for (const face of allFaces) {
        const dist = this.euclideanDistance(Array.from(descriptor), face.faceDescriptor);
        
        if (dist < threshold) {
            if (!bestMatch || dist < bestMatch.distance) {
                bestMatch = { maNV: face.nhanVien.maNV, distance: dist };
            }
        }
    }

    return bestMatch ? bestMatch.maNV : null;
  }
}