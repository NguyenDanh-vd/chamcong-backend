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
import { PhongbanService } from './phongban.service';
import { Roles } from 'src/common/roles.decorator';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Public } from 'src/common/public.decorator';

@Controller('phongban')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PhongbanController {
  constructor(private readonly phongbanService: PhongbanService) {}

  // ✅ Lấy danh sách tất cả phòng ban
  @Public()
   @Get()
  findAll() {
    return this.phongbanService.findAll();
  }

  // ✅ Lấy chi tiết phòng ban theo ID
  @Roles('quantrivien', 'nhansu')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.phongbanService.findOne(id);
  }

  // ✅ Tạo phòng ban mới
  @Roles('quantrivien')
  @Post()
  create(@Body() body: any) {
    return this.phongbanService.create(body);
  }

  // ✅ Cập nhật phòng ban
  @Roles('quantrivien')
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.phongbanService.update(id, body);
  }

  // ✅ Xóa phòng ban
  @Roles('quantrivien')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.phongbanService.remove(id);
  }
}
