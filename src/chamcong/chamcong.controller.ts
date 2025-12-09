import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  Request,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ChamcongService } from './chamcong.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { CreateChamCongDto } from './dto/create-chamcong.dto';
import { PointFaceDto } from './dto/point-face.dto';
import { FilterChamCongDto } from './dto/filter-chamcong.dto';

@Controller('chamcong')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChamcongController {
  constructor(private readonly chamcongService: ChamcongService) {}

  // Nhân viên check-in
  @Roles('nhanvien', 'quantrivien', 'nhansu')
  @Post('checkin')
  checkIn(@Body() body: { maNV: number; maCa?: number }) {
    return this.chamcongService.checkIn(body);
  }

  // Nhân viên check-out
  @Roles('nhanvien', 'quantrivien', 'nhansu')
  @Post('checkout')
  checkOut(@Body() body: { maNV: number }) {
    return this.chamcongService.checkOut(body.maNV);
  }

  // Chấm công bằng khuôn mặt
  @Roles('nhanvien')
  @Post('point-face')
  pointFace(@Body() dto: PointFaceDto) {
    return this.chamcongService.pointWithFace(dto);
  }

  // Lịch sử cá nhân
  @Roles('nhanvien', 'quantrivien', 'nhansu')
  @Get('me')
  getMyChamCong(@Request() req: any) {
    const maNV = req.user?.maNV;
    return this.chamcongService.getByNhanVien(maNV);
  }

  // Admin lấy danh sách
  @Get('admin-all')
  @Roles('quantrivien', 'nhansu')
  findAllForAdmin(@Query() query: FilterChamCongDto) {
    return this.chamcongService.filterChamCong(query);
  }

  // Lịch sử của nhân viên cụ thể
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('nhanvien/:maNV')
  getByNhanVien(@Param('maNV', ParseIntPipe) maNV: number) {
    return this.chamcongService.getByNhanVien(maNV);
  }

  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('filter')
  filterChamCong(
    @Query()
    query: {
      maNV?: number;
      hoTen?: string;
      tenCa?: string;
      trangThai?: string;
      tuNgay?: string;
      denNgay?: string;
    },
    @Request() req: any,
  ) {
    if (req.user?.role === 'nhanvien') {
      query.maNV = req.user.maNV;
    }
    return this.chamcongService.filterChamCong(query);
  }

  // Trạng thái hôm nay
  @Get('status/:maNV')
  getTodayStatus(@Param('maNV', ParseIntPipe) maNV: number) {
    return this.chamcongService.getTodayStatus(maNV);
  }

  // Bản ghi hôm nay
  @Get('today/:maNV')
  async getTodayRecordByMaNV(@Param('maNV', ParseIntPipe) maNV: number) {
    return this.chamcongService.getTodayRecord(maNV);
  }

  // --- CRUD ADMIN ---
  @Put(':id')
  @Roles('quantrivien', 'nhansu')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.chamcongService.update(id, updateData);
  }

  @Delete(':id')
  @Roles('quantrivien', 'nhansu')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chamcongService.remove(id);
  }

  @Post('admin-create')
  @Roles('quantrivien', 'nhansu')
  async createByAdmin(@Body() dto: CreateChamCongDto) {
    return this.chamcongService.createByAdmin(dto);
  }

  // ENDPOINT MỚI CHO TRANG LỊCH SỬ CỦA NHÂN VIÊN
  @UseGuards(JwtAuthGuard) // Bảo vệ endpoint, yêu cầu đăng nhập
  @Get('my-records')
  async findMyRecords(@Req() req, @Query() query) {
    // req.user.maNV được lấy từ token sau khi xác thực
    const maNV = req.user.maNV; 
    
    // Gọi phương thức mới, an toàn và rõ ràng
    return this.chamcongService.getMyRecords(maNV, query);
  }

  @Get('thongke/:maNV')
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  async getThongKe(@Param('maNV', ParseIntPipe) maNV: number) {
      return this.chamcongService.getThongKe(maNV);
  }
}


