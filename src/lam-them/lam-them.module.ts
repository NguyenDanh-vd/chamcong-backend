import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LamThem } from './entities/lam-them.entity';
import { LamThemService } from './lam-them.service';
import { LamThemController } from './lam-them.controller';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LamThem, NhanVien])],
  providers: [LamThemService],
  controllers: [LamThemController],
  exports: [LamThemService],
})
export class LamThemModule {}
