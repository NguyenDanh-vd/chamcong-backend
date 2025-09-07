import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhongBan } from './entities/phongban.entity';
import { PhongbanService } from './phongban.service';
import { PhongbanController } from './phongban.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PhongBan])],
  providers: [PhongbanService],
  controllers: [PhongbanController],
  exports: [PhongbanService],
})
export class PhongbanModule {}
