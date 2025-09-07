import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config'; // <-- BƯỚC 1: IMPORT CONFIG MODULE
import { MAIL_CONFIG } from './mail.config';

// Các module trong hệ thống
import { AuthModule } from './auth/auth.module';
import { NhanvienModule } from './nhanvien/nhanvien.module';
import { PhongbanModule } from './phongban/phongban.module';
import { CalamviecModule } from './calamviec/calamviec.module';
import { ChamcongModule } from './chamcong/chamcong.module';
import { NghiPhepModule } from './nghi-phep/nghi-phep.module';
import { LamThemModule } from './lam-them/lam-them.module';
import { FaceDataModule } from './face-data/face-data.module';
import { BaoCaoModule } from './baocao/baocao.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // --- BƯỚC 2: THÊM CONFIG MODULE VÀO ĐẦU DANH SÁCH IMPORTS ---
    ConfigModule.forRoot({
      isGlobal: true, // Rất quan trọng, giúp các module khác sử dụng được ConfigService
    }),
    
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'itglobal',
      autoLoadEntities: true,
      synchronize: false,
    }),

    // ✅ Cấu hình MailerModule
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: MAIL_CONFIG.user,
          pass: MAIL_CONFIG.pass,
        },
      },
      defaults: {
        from: '"No Reply" <noreply@example.com>',
      },
    }),

    // Import các module đã tạo
    AuthModule,
    NhanvienModule,
    PhongbanModule,
    CalamviecModule,
    ChamcongModule,
    NghiPhepModule,
    LamThemModule,
    FaceDataModule,
    BaoCaoModule,
    DashboardModule,
  ],
})
export class AppModule {}