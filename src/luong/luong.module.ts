import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Luong } from './entities/luong.entity';
import { LuongService } from './luong.service';
import { LuongController } from './luong.controller';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Luong, ChamCong, NhanVien])],
  controllers: [LuongController],
  providers: [LuongService],
})
export class LuongModule {}
