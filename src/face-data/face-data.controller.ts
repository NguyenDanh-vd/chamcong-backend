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

  /** Đăng ký hoặc cập nhật FaceID */
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Post('register')
  async registerFace(@Request() req: any, @Body() dto: RegisterFaceDto) {
    const maNV = req.user?.maNV;
    if (!maNV) {
      throw new BadRequestException('Không tìm thấy mã nhân viên từ token');
    }
    return this.faceDataService.registerFace(maNV, dto.faceDescriptor);
  }

  /** Chấm công bằng FaceID */
  @Roles('nhanvien')
  @Post('point')
  pointFace(@Body() dto: PointFaceDto) {
    return this.faceDataService.pointFace(dto.faceDescriptor, dto.maCa);
  }

  /** Lấy dữ liệu FaceID của 1 nhân viên */
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('nhanvien/:maNV')
  getByNhanVien(@Param('maNV', ParseIntPipe) maNV: number) {
    return this.faceDataService.getByNhanVien(maNV);
  }

  /** Kiểm tra nhân viên đã đăng ký FaceID chưa */
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('check/:maNV')
  checkFace(@Param('maNV', ParseIntPipe) maNV: number) {
    return this.faceDataService.checkFace(maNV);
  }

  /** Xóa toàn bộ FaceID của 1 nhân viên */
  @Roles('quantrivien')
  @Delete('nhanvien/:maNV')
  removeByNhanVien(@Param('maNV', ParseIntPipe) maNV: number) {
    return this.faceDataService.removeByNhanVien(maNV);
  }

  /** Xóa FaceID theo ID */
  @Roles('quantrivien')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.faceDataService.remove(id);
  }

  /** Kiểm tra chính mình đã đăng ký FaceID chưa */
@Roles('nhanvien', 'nhansu', 'quantrivien')
@Get('check-me')
async checkMe(@Request() req: any) {
  const maNV = req.user?.maNV;
  if (!maNV) {
    throw new BadRequestException('Không tìm thấy mã nhân viên từ token');
  }
  return this.faceDataService.checkFace(maNV); // { hasFace: true/false }
}

}