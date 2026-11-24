import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LuongService } from './luong.service';
import { UpdateLuongDto } from './dto/update-luong.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';

@Controller('luong')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LuongController {
  constructor(private readonly luongService: LuongService) {}

  // 📄 GET /luong - Lấy tất cả lương
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get()
  findAll() {
    return this.luongService.findAll();
  }

  // ⚙️ POST /luong/tinh-luong - Tính lương tự động theo tháng
  @Roles('nhansu', 'quantrivien')
  @Post('tinh-luong')
  tinhLuong(@Body() body: { thang: string }) {
    return this.luongService.tinhLuongTuDong(body.thang);
  }

  // 🟡 PATCH /luong/:id - Cập nhật trạng thái chung
  @Roles('nhansu', 'quantrivien')
  @Patch(':id')
  capNhatTrangThai(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { trangThai: string },
  ) {
    return this.luongService.capNhatTrangThai(id, body.trangThai);
  }

  // ✅ PATCH /luong/:id/da-tra - Đánh dấu đã trả lương
  @Roles('nhansu', 'quantrivien')
  @Patch(':id/da-tra')
  updateDaTra(@Param('id', ParseIntPipe) id: number) {
    return this.luongService.updateDaTra(id);
  }

  // ✏️ PATCH /luong/:id/chinh-sua - Cập nhật thông tin lương
  @Roles('nhansu', 'quantrivien')
  @Patch(':id/chinh-sua')
  async chinhSuaLuong(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLuongDto: UpdateLuongDto, // ⬅️ sử dụng DTO
  ) {
    return this.luongService.chinhSuaLuong(id, updateLuongDto);
  }
}
