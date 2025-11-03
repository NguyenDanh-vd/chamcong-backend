import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { NhanvienService } from './nhanvien.service';
import { Roles } from 'src/common/roles.decorator';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { CreateNhanVienDto } from './dto/create-nhanvien.dto';
import { UpdateNhanvienDto } from './dto/update-nhanvien.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';
import { VaiTro } from 'src/nhanvien/enums/vai-tro.enum';

@Controller('nhanvien')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NhanvienController {
  constructor(private readonly nhanvienService: NhanvienService) {}

  @Get('all-basic')
  @Roles(VaiTro.QUANTRIVIEN, VaiTro.NHANSU)
  findAllBasic() {
    return this.nhanvienService.findAllBasic();
  }

  @Roles(VaiTro.QUANTRIVIEN, VaiTro.NHANSU, VaiTro.NHANVIEN)
  @Get()
  findAll(@Query('maPB') maPB?: number) {
    return this.nhanvienService.findAll(maPB ? +maPB : undefined);
  }

  @Roles(VaiTro.QUANTRIVIEN, VaiTro.NHANSU, VaiTro.NHANVIEN)
  @Get('profile')
  async findProfile(@Request() req: any) {
    const userFromDb = await this.nhanvienService.findOne(req.user.maNV); 

    if (!userFromDb) {
    throw new NotFoundException('Không tìm thấy thông tin người dùng');
  }
  return {
    id: userFromDb.maNV, // <-- ÁNH XẠ maNV SANG id TẠI ĐÂY
    hoTen: userFromDb.hoTen,
    email: userFromDb.email,
    soDienThoai: userFromDb.soDienThoai,
    gioiTinh: userFromDb.gioiTinh, 
    tuoi: userFromDb.tuoi,
    diaChi: userFromDb.diaChi,
    cccd: userFromDb.cccd,
    ngayBatDau: userFromDb.ngayBatDau, 
    role: userFromDb.vaiTro,
    phongBan: userFromDb.phongBan, 
    // Service chỉ trả về tên file, controller sẽ tạo URL đầy đủ
    avatarUrl: userFromDb.avatar 
      ? `${process.env.BASE_URL}/uploads/avatars/${userFromDb.avatar}`
      : null,
  };
}

  @Roles(VaiTro.QUANTRIVIEN, VaiTro.NHANSU, VaiTro.NHANVIEN)
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() body: UpdateNhanvienDto) {
    return this.nhanvienService.update(req.user.maNV, body, req.user);
  }

  @Roles(VaiTro.QUANTRIVIEN)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nhanvienService.findOne(id);
  }

  @Roles(VaiTro.QUANTRIVIEN,VaiTro.NHANSU)
  @Post()
  create(@Body() body: CreateNhanVienDto) {
    return this.nhanvienService.create(body);
  }

  @Roles(VaiTro.QUANTRIVIEN)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateNhanvienDto,
  ) {
    return this.nhanvienService.update(id, body);
  }

  @Roles(VaiTro.QUANTRIVIEN, VaiTro.NHANSU, VaiTro.NHANVIEN)
  @Put(':id/password')
  updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { oldPassword?: string; newPassword: string },
    @Request() req: any,
  ) {
    if (req.user.vaiTro !== VaiTro.QUANTRIVIEN && req.user.maNV !== id) {
      throw new ForbiddenException('Không được đổi mật khẩu của người khác');
    }
    return this.nhanvienService.updatePassword(
      id,
      body.oldPassword,
      body.newPassword,
      req.user,
    );
  }

  @Roles(VaiTro.QUANTRIVIEN) // Chỉ có Quản trị viên được dùng chức năng này
  @Patch(':id/reset-password-admin')
  resetPasswordByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword: string },
  ) {
    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    return this.nhanvienService.resetPasswordByAdmin(id, body.newPassword);
  }

  @Roles(VaiTro.QUANTRIVIEN, VaiTro.NHANSU, VaiTro.NHANVIEN)
  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `avatar-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Chỉ hỗ trợ file ảnh JPG/PNG'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {

    console.log('DEBUG: User performing action:', req.user);

    if (req.user.role !== VaiTro.QUANTRIVIEN && req.user.maNV !== id) {
      throw new ForbiddenException('Không được đổi avatar của người khác');
    }
    if (!file) throw new BadRequestException('Chưa upload file hợp lệ');

    console.log('Upload avatar:', file); 
    // chỉ lưu tên file vào DB
    return this.nhanvienService.updateAvatar(id, file.filename);
  }

  @Roles(VaiTro.QUANTRIVIEN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nhanvienService.remove(id);
  }

}