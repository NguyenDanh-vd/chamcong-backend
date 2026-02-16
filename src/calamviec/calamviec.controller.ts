import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CalamviecService } from './calamviec.service';
import { Roles } from '../common/roles.decorator';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { CreateCaLamViecDto } from './dto/create-calamviec.dto';
import { UpdateCaLamViecDto } from './dto/update-calamviec.dto';

@Controller('calamviec')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalamviecController {
  constructor(private readonly calamviecService: CalamviecService) {}

  @Get('today')
  @Roles('quantrivien', 'nhansu')
  getTodayShifts() {
    return this.calamviecService.getTodayShifts();
  }

  @Get('current-shift')
  @Roles('quantrivien', 'nhansu', 'nhanvien')
  async getCurrentShift() {
    console.log('👉 API /current-shift được gọi');
    return this.calamviecService.getCurrentShift();
  }

  // --- LẤY TOÀN BỘ ---
  @Get()
  @Roles('quantrivien', 'nhansu')
  findAll() {
    return this.calamviecService.findAll();
  }

  // --- ROUTE CÓ THAM SỐ PHẢI ĐỂ CUỐI ---
  @Get(':id')
  @Roles('quantrivien', 'nhansu')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.calamviecService.findOne(id);
  }

  @Post()
  @Roles('quantrivien', 'nhansu')
  create(@Body() body: CreateCaLamViecDto) {
    return this.calamviecService.create(body);
  }

  @Put(':id')
  @Roles('quantrivien')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCaLamViecDto,
  ) {
    return this.calamviecService.update(id, body);
  }

  @Put(':id/status')
  @Roles('quantrivien')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('trangThai') trangThai: boolean,
  ) {
    return this.calamviecService.updateStatus(id, trangThai);
  }

  @Delete(':id')
  @Roles('quantrivien')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.calamviecService.remove(id);
  }
}
