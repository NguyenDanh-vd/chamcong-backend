import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

dotenv.config();

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true; // Cho phép tool như Postman, curl

  // Lấy danh sách domain cho phép thêm qua biến môi trường
  const envList = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const u = new URL(origin);

    // ✅ Cho localhost và 127.0.0.1 (mọi port)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;

    // ✅ Cho các IP LAN 192.168.x.x (mọi port)
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(u.hostname)) return true;

    // ✅ Cho các domain *.vercel.app
    if (u.hostname.endsWith('.vercel.app')) return true;

    // ✅ Cho phép domain khai báo thêm qua ENV
    if (envList.includes(origin)) return true;

    return false;
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Validate DTO (bảo vệ input)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ Cấu hình thư mục static cho upload avatar
  const uploadDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir);
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  // ✅ Cấu hình CORS linh hoạt cho localhost, IP LAN, Vercel, ENV
  app.enableCors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      console.warn(`❌ CORS blocked: ${origin}`);
      return cb(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
  });

  // ✅ Log thông tin DB để xác nhận ENV
  try {
    const raw = process.env.DATABASE_URL;
    if (!raw) {
      console.warn('[DB] DATABASE_URL is missing');
    } else {
      const u = new URL(raw);
      console.log('[DB]', {
        host: u.hostname,
        sslmode: u.searchParams.get('sslmode'),
      });
    }
  } catch (e) {
    console.warn('[DB] DATABASE_URL parse error:', (e as Error).message);
  }

  // ✅ Khởi chạy server
  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
bootstrap();
