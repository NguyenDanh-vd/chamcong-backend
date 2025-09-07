import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChamCong } from './entities/chamcong.entity';
import { ChamcongService } from './chamcong.service';
import { ChamcongController } from './chamcong.controller';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { CaLamViec } from 'src/calamviec/entities/calamviec.entity';
import { FaceData } from 'src/face-data/entities/face-data.entity'; // import thêm
import { CalamviecModule } from 'src/calamviec/calamviec.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ChamCong, NhanVien, CaLamViec, FaceData]),
    CalamviecModule,
  ],
  providers: [ChamcongService],
  controllers: [ChamcongController],
  exports: [ChamcongService],
})
export class ChamcongModule {}
