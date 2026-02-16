import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { LuongService } from './luong.service';
import { UpdateLuongDto } from './dto/update-luong.dto';

@Controller('luong')
export class LuongController {
  constructor(private readonly luongService: LuongService) {}

  // 📄 GET /luong - Lấy tất cả lương
  @Get()
  findAll() {
    return this.luongService.findAll();
  }

  // ⚙️ POST /luong/tinh-luong - Tính lương tự động theo tháng
  @Post('tinh-luong')
  tinhLuong(@Body() body: { thang: string }) {
    return this.luongService.tinhLuongTuDong(body.thang);
  }

  // 🟡 PATCH /luong/:id - Cập nhật trạng thái chung
  @Patch(':id')
  capNhatTrangThai(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { trangThai: string },
  ) {
    return this.luongService.capNhatTrangThai(id, body.trangThai);
  }

  // ✅ PATCH /luong/:id/da-tra - Đánh dấu đã trả lương
  @Patch(':id/da-tra')
  updateDaTra(@Param('id', ParseIntPipe) id: number) {
    return this.luongService.updateDaTra(id);
  }

  // ✏️ PATCH /luong/:id/chinh-sua - Cập nhật thông tin lương
  @Patch(':id/chinh-sua')
  async chinhSuaLuong(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLuongDto: UpdateLuongDto, // ⬅️ sử dụng DTO
  ) {
    return this.luongService.chinhSuaLuong(id, updateLuongDto);
  }
}
