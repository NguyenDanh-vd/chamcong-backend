import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NghiPhep } from './entities/nghi-phep.entity';
import { NghiPhepService } from './nghi-phep.service';
import { NghiPhepController } from './nghi-phep.controller';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NghiPhep, NhanVien])],
  providers: [NghiPhepService],
  controllers: [NghiPhepController],
  exports: [NghiPhepService],
})
export class NghiPhepModule {}
