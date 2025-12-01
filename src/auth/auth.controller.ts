import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { CreateNhanVienDto } from 'src/nhanvien/dto/create-nhanvien.dto';
import { FaceDataService } from 'src/face-data/face-data.service';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private faceDataService: FaceDataService
  ) {}

  // Đăng ký với upload avatar
  @Post('register')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars', 
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  register(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateNhanVienDto,
  ) {
    const {
      hoTen,
      email,
      matKhau,
      soDienThoai,
      gioiTinh,
      tuoi,
      diaChi,
      vaiTro,
      cccd,
      ngayBatDau,
      maPB,
    } = dto;

    const avatarFileName = file ? file.filename : undefined;

    return this.authService.register(
      hoTen,
      email,
      matKhau,
      soDienThoai,
      gioiTinh,
      tuoi,
      diaChi,
      vaiTro,
      cccd,
      ngayBatDau ? new Date(ngayBatDau) : undefined,
      avatarFileName,
      maPB,
    );
  }

  // Đăng nhập
  @Post('login')
  login(@Body('email') email: string, @Body('matKhau') matKhau: string) {
    return this.authService.login(email, matKhau);
  }

  // Lấy profile
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.email);
  }

  // Đổi mật khẩu
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @Request() req,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(req.user.email, oldPassword, newPassword);
  }

  // Quên mật khẩu (gửi mail reset)
  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  // Reset mật khẩu bằng token
  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }
  
  @Post('login-face')
  async loginFace(@Body('descriptor') descriptor: number[]) {
    return this.authService.loginFace(descriptor);
  }

  // Thêm API Login mới vào AuthController
@Post('login-face-mobile')
async loginFaceMobile(@Body() body: { imageBase64: string }) {
    if (!body.imageBase64) throw new BadRequestException("Thiếu ảnh");
    
    // 1. Nhờ FaceDataService tìm xem đây là ai
    const maNV = await this.faceDataService.identifyUserFromImage(body.imageBase64); 
    
    if (!maNV) {
        // Nếu không tìm thấy ai khớp trong DB
        throw new UnauthorizedException("Khuôn mặt không khớp với bất kỳ ai.");
    }

    // 2. Lấy thông tin user và tạo token
    const user = await this.authService.validateUserByMaNV(maNV); 
    if (!user) throw new UnauthorizedException("Lỗi tài khoản.");

    return this.authService.loginWithFace(user);
}
}