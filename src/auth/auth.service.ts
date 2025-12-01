import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { FaceData } from 'src/face-data/entities/face-data.entity'; 
import { VaiTro } from 'src/nhanvien/enums/vai-tro.enum';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { resetPasswordTemplate } from 'src/email-templates/reset-password';
import * as nodemailer from 'nodemailer';
import { NhanvienService } from 'src/nhanvien/nhanvien.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(NhanVien) private nvRepo: Repository<NhanVien>,
    // Inject thêm FaceData Repo để lấy dữ liệu khuôn mặt so sánh
    @InjectRepository(FaceData) private faceDataRepo: Repository<FaceData>,
    private jwtService: JwtService,
    private nhanVienService: NhanvienService,
  ) {}

  // --- Hàm hỗ trợ tính khoảng cách giữa 2 vector khuôn mặt (Euclidean Distance) ---
  private getEuclideanDistance(face1: number[], face2: number[]): number {
    return Math.sqrt(
      face1
        .map((val, i) => val - face2[i])
        .reduce((sum, diff) => sum + diff * diff, 0),
    );
  }

  // ✅ Đăng nhập bằng Face ID (MỚI)
  async loginFace(descriptor: number[]) {
    const allFaces = await this.faceDataRepo.find({
      relations: ['nhanVien'], 
    });

    const threshold = 0.5;
    let foundUser: NhanVien | null = null;

    for (const faceRecord of allFaces) {
      let storedDescriptor: number[];
      // Ép kiểu as any để tránh lỗi TypeScript nếu DB lưu JSON string
      const rawDescriptor = faceRecord.faceDescriptor as any;

      if (typeof rawDescriptor === 'string') {
        storedDescriptor = JSON.parse(rawDescriptor);
      } else {
        storedDescriptor = rawDescriptor;
      }

      const distance = this.getEuclideanDistance(descriptor, storedDescriptor);

      if (distance < threshold) {
        foundUser = faceRecord.nhanVien;
        break; 
      }
    }

    if (!foundUser) {
      throw new UnauthorizedException('Khuôn mặt không khớp với nhân viên nào');
    }

    const payload = {
      maNV: foundUser.maNV,
      email: foundUser.email,
      role: foundUser.vaiTro,
      hoTen: foundUser.hoTen,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      role: foundUser.vaiTro,
      hoTen: foundUser.hoTen,
      maNV: foundUser.maNV,
      avatarUrl: foundUser.avatar
        ? `${process.env.BASE_URL || 'https://chamcong-backend-8pgb.onrender.com'}/uploads/avatars/${foundUser.avatar}`
        : null,
    };
  }

  // Đăng ký
  async register(
    hoTen: string,
    email: string,
    matKhau: string,
    soDienThoai?: string,
    gioiTinh?: string,
    tuoi?: number,
    diaChi?: string,
    vaiTro: VaiTro = VaiTro.NHANVIEN,
    cccd?: string,
    ngayBatDau?: Date,
    avatarFileName?: string,
    maPB?: any,
  ) {
    if (!Object.values(VaiTro).includes(vaiTro)) {
      throw new BadRequestException('Vai trò không hợp lệ');
    }

    const exist = await this.nvRepo.findOne({ where: { email } });
    if (exist) throw new BadRequestException('Email đã tồn tại');

    const hashed = await bcrypt.hash(matKhau, 10);

    const nv = this.nvRepo.create({
      hoTen,
      email,
      matKhau: hashed,
      vaiTro,
      soDienThoai,
      gioiTinh: gioiTinh as 'Nam' | 'Nữ' | 'Khác',
      tuoi,
      diaChi,
      cccd,
      ngayBatDau,
      avatar: avatarFileName,
      phongBan: maPB ? { maPB: maPB } : undefined,
    });

    return this.nvRepo.save(nv);
  }

  // ✅ Đăng nhập thường
  async login(email: string, matKhau: string) {
    const nv = await this.nvRepo.findOne({ where: { email } });
    if (!nv) throw new UnauthorizedException('Sai email hoặc mật khẩu');

    const isMatch = await bcrypt.compare(matKhau, nv.matKhau);
    if (!isMatch) throw new UnauthorizedException('Sai email hoặc mật khẩu');

    const payload = {
      maNV: nv.maNV,
      email: nv.email,
      role: nv.vaiTro,
      hoTen: nv.hoTen,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      role: nv.vaiTro,
      hoTen: nv.hoTen,
      maNV: nv.maNV,
      cccd: nv.cccd,
      ngayBatDau: nv.ngayBatDau,
      gioiTinh: nv.gioiTinh || null,
      tuoi: nv.tuoi || null,
      avatarUrl: nv.avatar
        ? `${process.env.BASE_URL || 'https://chamcong-backend-8pgb.onrender.com'}/uploads/avatars/${nv.avatar}`
        : null,
    };
  }

  // Lấy thông tin profile
  async getProfile(email: string) {
    const nv = await this.nvRepo.findOne({ where: { email } });
    if (!nv) throw new UnauthorizedException('Không tìm thấy người dùng');

    const BASE = process.env.BASE_URL || 'https://chamcong-backend-8pgb.onrender.com';
    return {
      maNV: nv.maNV,
      email: nv.email,
      hoTen: nv.hoTen,
      role: nv.vaiTro,
      gioiTinh: nv.gioiTinh || null,
      tuoi: nv.tuoi || null,
      cccd: nv.cccd,
      ngayBatDau: nv.ngayBatDau,
      avatarUrl: nv.avatar ? `${BASE}/uploads/avatars/${nv.avatar}` : null,
    };
  }

  // Đổi mật khẩu
  async changePassword(email: string, oldPassword: string, newPassword: string) {
    const nv = await this.nvRepo.findOne({ where: { email } });
    if (!nv) throw new UnauthorizedException('Không tìm thấy người dùng');

    const isMatch = await bcrypt.compare(oldPassword, nv.matKhau);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không đúng');

    nv.matKhau = await bcrypt.hash(newPassword, 10);
    await this.nvRepo.save(nv);

    return { message: 'Đổi mật khẩu thành công' };
  }
  
  // Quên mật khẩu
  async forgotPassword(email: string) {
    const nv = await this.nvRepo.findOne({ where: { email } });
    if (!nv) throw new NotFoundException('Email không tồn tại');

    const token = await this.jwtService.signAsync(
      { email },
      {
        secret: process.env.JWT_SECRET || 'secret', 
        expiresIn: '15m',
      },
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER, 
        pass: process.env.MAIL_PASS, 
      },
    });

    await transporter.sendMail({
      from: `"ITGlobal Support" <${process.env.MAIL_USER}>`, 
      to: email,
      subject: 'Đặt lại mật khẩu - ITGlobal',
      html: resetPasswordTemplate(resetLink, nv.hoTen),
    });

    return { message: 'Link đặt lại mật khẩu đã được gửi vào email của bạn' };
  }

  // Đặt lại mật khẩu
  async resetPassword(token: string, newPassword: string) {
    try {
      const payload: any = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'secret',
      });

      const nv = await this.nvRepo.findOne({ where: { email: payload.email } });
      if (!nv) throw new NotFoundException('Không tìm thấy người dùng');

      nv.matKhau = await bcrypt.hash(newPassword, 10);
      await this.nvRepo.save(nv);

      return { message: 'Đặt lại mật khẩu thành công' };
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  /** 1. Tìm user chỉ bằng mã NV (Dùng cho FaceID) */
  async validateUserByMaNV(maNV: number): Promise<any> {
    const user = await this.nhanVienService.findOne(maNV); 
    if (user) {
      return user;
    }
    return null;
  }

  /** 2. Tạo Token riêng cho FaceID (Fix lỗi TS2551) */
  async loginWithFace(user: any) {
    // Sử dụng user object đã được validate
    const payload = { 
        email: user.email, 
        sub: user.maNV, 
        role: user.vaiTro, 
        maNV: user.maNV, 
        hoTen: user.hoTen 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}