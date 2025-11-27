import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { FaceData } from 'src/face-data/entities/face-data.entity'; 
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // Đã khai báo đúng ở đây
    TypeOrmModule.forFeature([NhanVien, FaceData]), 
    JwtModule.register({
      global: true,
      secret: 'SECRET_KEY', 
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}