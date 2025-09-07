import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaoCaoService } from './baocao.service';
import { BaoCaoController } from './baocao.controller';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { NghiPhep } from 'src/nghi-phep/entities/nghi-phep.entity';
import { LamThem } from 'src/lam-them/entities/lam-them.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChamCong, NghiPhep, LamThem, NhanVien]),
  ],
  controllers: [BaoCaoController],
  providers: [BaoCaoService],
})
export class BaoCaoModule {}
