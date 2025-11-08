import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MAIL_CONFIG } from './mail.config';

// Các module khác
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
import { AiModule } from './ai/ai.module';
import { LuongModule } from './luong/luong.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Cấu hình TypeORM dùng DATABASE_URL từ .env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url: dbUrl,      // dùng DATABASE_URL
          autoLoadEntities: true,
          synchronize: false, // production nên false
          ssl: {
            rejectUnauthorized: false, // cần nếu DB Neon yêu cầu SSL
          },
        };
      },
    }),

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
    AiModule,
    LuongModule,
  ],
})
export class AppModule {}
