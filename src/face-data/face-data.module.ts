import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaceData } from './entities/face-data.entity';
import { FaceDataService } from './face-data.service';
import { FaceDataController } from './face-data.controller';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { CaLamViec } from 'src/calamviec/entities/calamviec.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FaceData, NhanVien,ChamCong, CaLamViec])],
  providers: [FaceDataService],
  controllers: [FaceDataController],
  exports: [FaceDataService],
})
export class FaceDataModule {}
