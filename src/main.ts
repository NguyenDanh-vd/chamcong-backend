import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common'; 

dotenv.config();


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Thêm ValidationPipe để DTO được validate
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // chỉ nhận các field khai báo trong DTO
      forbidNonWhitelisted: true, // chặn field thừa, báo lỗi luôn
      transform: true, // tự động transform string -> number cho query/param
    }),
  );

  // Tạo thư mục uploads nếu chưa có
  const uploadDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
  }

  // Cho phép truy cập static file
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: [
      'http://localhost:3001',
      //'http://192.168.217.1:3001',
      'http://192.168.2.9:3001',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
