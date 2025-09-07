import { Controller, Post, Get, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { LamThemService } from './lam-them.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';

@Controller('lamthem')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LamThemController {
  constructor(private readonly lamThemService: LamThemService) {}

  // Nhân viên đăng ký LT
  @Roles('nhanvien')
  @Post()
  create(@Req() req, @Body() body: any) {
    return this.lamThemService.create(req.user.maNV, body);
  }

  // Nhân viên xem danh sách LT của mình
  @Roles('nhanvien', 'nhansu', 'quantrivien')
  @Get('nhanvien')
  getByNhanVien(@Req() req) {
    return this.lamThemService.findByNhanVien(req.user.maNV);
  }

  // HR/Quản trị viên xem tất cả đơn làm thêm
  @Roles('nhansu', 'quantrivien')
  @Get()
  getAll() {
    return this.lamThemService.findAll();
  }

  // HR/Quản trị viên duyệt LT
  @Roles('nhansu', 'quantrivien')
  @Put('duyet/:maLT')
  duyet(@Param('maLT') maLT: number, @Body('trangThai') trangThai: string) {
    return this.lamThemService.duyet(+maLT, trangThai);
  }
}
