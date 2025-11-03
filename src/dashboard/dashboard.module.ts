import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { NhanVien } from '../nhanvien/entities/nhanvien.entity';
import { ChamCong } from '../chamcong/entities/chamcong.entity';
import { NghiPhep } from '../nghi-phep/entities/nghi-phep.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NhanVien, ChamCong, NghiPhep]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
