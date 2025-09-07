import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaLamViec } from './entities/calamviec.entity';
import { CalamviecService } from './calamviec.service';
import { CalamviecController } from './calamviec.controller';
import { ChamCong } from '../chamcong/entities/chamcong.entity';
import { NhanVien } from '../nhanvien/entities/nhanvien.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CaLamViec, ChamCong, NhanVien])],
  providers: [CalamviecService],
  controllers: [CalamviecController],
  exports: [CalamviecService],
})
export class CalamviecModule {}
