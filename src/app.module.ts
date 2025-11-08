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
import { AiModule } from './ai/ai.module';
import { LuongModule } from './luong/luong.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '0706',
      database: 'itglobal',
      autoLoadEntities: true,
      synchronize: false,
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
