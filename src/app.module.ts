import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config'; 
import { MAIL_CONFIG } from './mail.config';

// Import các module khác...
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
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Đây là phần TypeORM “2 chế độ” bạn hỏi
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isRender = !!process.env.RENDER;
        return isRender
          ? {
              type: 'postgres',
              url: process.env.DATABASE_URL,
              autoLoadEntities: true,
              synchronize: false,
              ssl: { rejectUnauthorized: false },
            }
          : {
              type: 'postgres',
              host: 'localhost',
              port: 5432,
              username: 'postgres',
              password: '0706',
              database: 'itglobal',
              autoLoadEntities: true,
              synchronize: true,
            };
      },
    }),

    // Mailer và các module khác
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
