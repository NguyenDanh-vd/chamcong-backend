import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NhanVien } from './entities/nhanvien.entity';
import { NhanvienService } from './nhanvien.service';
import { NhanvienController } from './nhanvien.controller';
import { PhongBan } from 'src/phongban/entities/phongban.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NhanVien,PhongBan])],
  providers: [NhanvienService],
  controllers: [NhanvienController],
  exports: [NhanvienService],
})
export class NhanvienModule {}
