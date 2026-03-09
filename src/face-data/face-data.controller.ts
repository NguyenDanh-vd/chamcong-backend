import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { FaceDataService } from './face-data.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { RegisterFaceDto, PointFaceDto } from './dto/create-face-datum.dto';

type AuthenticatedRequest = ExpressRequest & {
  user?: {
    maNV?: number;
  };
};

@Controller('facedata')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FaceDataController {
  constructor(private readonly faceDataService: FaceDataService) {}

  /**
   * Đăng ký FaceID từ Mobile
   * Body:
   * { maNV: 1, imageBase64: "..." }
   * hoặc
   * { maNV: 1, imagesBase64: ["...", "..."] }
   */
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Post('register-mobile')
  async registerFaceMobile(
    @Body()
    body: {
      maNV: number;
      imageBase64?: string;
      imagesBase64?: string[];
    },
  ) {
    if (!body.maNV) {
      throw new BadRequestException('Thiếu thông tin maNV');
    }

    if (body.imagesBase64 && body.imagesBase64.length > 0) {
      return this.faceDataService.registerFaceFromMobileMultiple(
        body.maNV,
        body.imagesBase64,
      );
    }

    if (body.imageBase64) {
      return this.faceDataService.registerFaceFromMobile(
        body.maNV,
        body.imageBase64,
      );
    }

    throw new BadRequestException('Thiếu ảnh (imageBase64 hoặc imagesBase64)');
  }

  /**
   * Chấm công từ Mobile
   */
  @Roles('nhanvien')
  @Post('point-mobile')
  async pointFaceMobile(
    @Body() body: { maNV: number; imageBase64: string; maCa: number },
  ) {
    if (!body.maNV || !body.imageBase64 || !body.maCa) {
      throw new BadRequestException(
        'Thiếu dữ liệu chấm công (maNV, imageBase64, maCa)',
      );
    }

    return this.faceDataService.pointFaceMobile(
      body.maNV,
      body.imageBase64,
      body.maCa,
    );
  }

  /**
   * Đăng ký face từ Web (images)
   */
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Post('register')
  async registerFace(
    @Request() req: AuthenticatedRequest,
    @Body() dto: RegisterFaceDto,
  ) {
    const maNV = req.user?.maNV;

    if (!maNV) {
      throw new BadRequestException('Không tìm thấy mã nhân viên từ token');
    }

    if (!dto.images || dto.images.length === 0) {
      throw new BadRequestException('Thiếu dữ liệu ảnh');
    }

    return this.faceDataService.registerFaceFromMobileMultiple(maNV, dto.images);
  }

  /**
   * Đăng ký nhiều ảnh (multi-angle)
   * Frontend gửi:
   * { images: ["base64", "base64", "base64"] }
   */
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Post('register-multiple')
  async registerFaceMultiple(
    @Request() req: AuthenticatedRequest,
    @Body() body: { images: string[] },
  ) {
    const maNV = req.user?.maNV;

    if (!maNV) {
      throw new BadRequestException('Không tìm thấy mã nhân viên từ token');
    }

    if (!body.images || body.images.length === 0) {
      throw new BadRequestException('Thiếu dữ liệu ảnh');
    }

    return this.faceDataService.registerFaceFromMobileMultiple(maNV, body.images);
  }

  /**
   * Chấm công bằng face
   */
  @Roles('nhanvien')
  @Post('point')
  pointFace(@Body() dto: PointFaceDto) {
    return this.faceDataService.pointFace(dto.faceDescriptor, dto.maCa);
  }

  // ===== API quản lý =====

  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('nhanvien/:maNV')
  getByNhanVien(@Param('maNV', ParseIntPipe) maNV: number) {
    return this.faceDataService.getByNhanVien(maNV);
  }

  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('check/:maNV')
  checkFace(@Param('maNV', ParseIntPipe) maNV: number) {
    return this.faceDataService.checkFace(maNV);
  }

  @Roles('quantrivien')
  @Delete('nhanvien/:maNV')
  removeByNhanVien(@Param('maNV', ParseIntPipe) maNV: number) {
    return this.faceDataService.removeByNhanVien(maNV);
  }

  @Roles('quantrivien')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.faceDataService.remove(id);
  }

  /**
   * Kiểm tra face của chính mình
   */
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('check-me')
  async checkMe(@Request() req: AuthenticatedRequest) {
    const maNV = req.user?.maNV;

    if (!maNV) {
      throw new BadRequestException('Không tìm thấy mã nhân viên từ token');
    }

    return this.faceDataService.checkFace(maNV);
  }
}