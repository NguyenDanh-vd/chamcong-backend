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
  ParseIntPipe
} from '@nestjs/common';
import { FaceDataService } from './face-data.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { RegisterFaceDto, PointFaceDto } from './dto/create-face-datum.dto';

@Controller('facedata')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FaceDataController {
  constructor(private readonly faceDataService: FaceDataService) {}

  /** * Đăng ký FaceID từ Mobile 
   * Body: { maNV: 1, imageBase64: "data:image/jpeg;base64,..." }
   */
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Post('register-mobile')
  async registerFaceMobile(@Body() body: { maNV: number; imageBase64: string }) {
    if (!body.maNV || !body.imageBase64) {
      throw new BadRequestException('Thiếu thông tin maNV hoặc ảnh (imageBase64)');
    }
    return this.faceDataService.registerFaceFromMobile(body.maNV, body.imageBase64);
  }

  /** * Chấm công từ Mobile 
   * Body: { maNV: 1, imageBase64: "...", maCa: 1 }
   */
  @Roles('nhanvien')
  @Post('point-mobile')
  async pointFaceMobile(@Body() body: { maNV: number; imageBase64: string; maCa: number }) {
    if (!body.maNV || !body.imageBase64 || !body.maCa) {
      throw new BadRequestException('Thiếu dữ liệu chấm công (maNV, imageBase64, maCa)');
    }
    return this.faceDataService.pointFaceMobile(body.maNV, body.imageBase64, body.maCa);
  }

  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Post('register')
  async registerFace(@Request() req: any, @Body() dto: RegisterFaceDto) {
    const maNV = req.user?.maNV;
    if (!maNV) {
      throw new BadRequestException('Không tìm thấy mã nhân viên từ token');
    }
    return this.faceDataService.registerFace(maNV, dto.faceDescriptor);
  }

  @Roles('nhanvien')
  @Post('point')
  pointFace(@Body() dto: PointFaceDto) {
    return this.faceDataService.pointFace(dto.faceDescriptor, dto.maCa);
  }

  // --- CÁC API GET/DELETE CHUNG (DÙNG CHO CẢ 2) ---

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

  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('check-me')
  async checkMe(@Request() req: any) {
    const maNV = req.user?.maNV;
    if (!maNV) {
      throw new BadRequestException('Không tìm thấy mã nhân viên từ token');
    }
    return this.faceDataService.checkFace(maNV); 
  }
}