import { Controller, Post, Get, Put, Param, Body, UseGuards, Delete } from '@nestjs/common';
import { NghiPhepService } from './nghi-phep.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';

@Controller('nghiphep')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NghiPhepController {
  constructor(private readonly nghiPhepService: NghiPhepService) {}

  // Nhân viên gửi đơn xin nghỉ
  @Roles('nhanvien')
  @Post(':maNV')
  create(@Param('maNV') maNV: number, @Body() body: any) {
    return this.nghiPhepService.create(+maNV, body);
  }

  // Nhân viên xem danh sách đơn nghỉ của mình
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('nhanvien/:maNV')
  getByNhanVien(@Param('maNV') maNV: number) {
    return this.nghiPhepService.getByNhanVien(+maNV);
  }

  // HR hoặc Quản trị viên duyệt đơn
  @Roles('nhansu', 'quantrivien')
  @Put('duyet/:maDon')
  duyet(@Param('maDon') maDon: number, @Body('trangThai') trangThai: string) {
    return this.nghiPhepService.duyet(+maDon, trangThai);
  }
  // ✅ HR hoặc Quản trị viên xem toàn bộ đơn nghỉ
 @Roles('nhansu', 'quantrivien')
 @Get()
  getAll() {
   return this.nghiPhepService.getAll()
 }

 @Roles('nhansu', 'quantrivien')
@Delete(':maDon')
remove(@Param('maDon') maDon: number) {
  return this.nghiPhepService.remove(+maDon);
}

}
