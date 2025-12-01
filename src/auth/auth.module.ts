import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { FaceData } from 'src/face-data/entities/face-data.entity'; 
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { NhanvienModule } from 'src/nhanvien/nhanvien.module';
import {FaceDataModule } from 'src/face-data/face-data.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    // Đã khai báo đúng ở đây
    TypeOrmModule.forFeature([NhanVien, FaceData]), 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // Lấy secret key từ biến môi trường (ví dụ: JWT_SECRET_KEY=motchuoibatkyratdai)
        secret: configService.get<string>('JWT_SECRET_KEY') || 'FALLBACK_SECRET_NEU_THIEU', 
        // Lấy thời gian hết hạn từ biến môi trường
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRY_TIME') || '8h' },
        global: true,
      }),
      inject: [ConfigService], // Tiêm ConfigService vào useFactory
    }),
    NhanvienModule, 
    FaceDataModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}