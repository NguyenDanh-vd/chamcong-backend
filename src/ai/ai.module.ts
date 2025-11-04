import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { NghiPhep } from 'src/nghi-phep/entities/nghi-phep.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChamCong, NghiPhep, NhanVien])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
