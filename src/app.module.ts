import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MAIL_CONFIG } from './mail.config';

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
      envFilePath: ['.env.key', '.env'], 
    }),

    MailerModule.forRoot(MAIL_CONFIG),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('DATABASE_URL');
          if (!dbUrl) {
            throw new Error('DATABASE_URL is missing. Add it to your .env (local) or env vars (Render).');
          }

        const u = new URL(dbUrl);
        const useSSL =
        u.hostname.endsWith('neon.tech') ||
        u.searchParams.get('sslmode') === 'require';

        return {
          type: 'postgres',
          url: dbUrl,
          autoLoadEntities: true,
          synchronize: false,
          ssl: useSSL ? { rejectUnauthorized: false } : false,
          ...(useSSL ? { extra: { ssl: { rejectUnauthorized: false } } } : {}),
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
