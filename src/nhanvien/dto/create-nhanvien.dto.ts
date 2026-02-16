import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { VaiTro } from '../enums/vai-tro.enum';

export class CreateNhanVienDto {
  @IsString()
  hoTen: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  matKhau: string;

  @IsOptional()
  @IsString()
  soDienThoai?: string;

  @IsString({ message: 'Địa chỉ phải là một chuỗi' })
  @IsOptional()
  diaChi?: string;

  // 👇 Thêm CCCD
  @IsOptional()
  @IsString()
  cccd?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu phải đúng định dạng YYYY-MM-DD' })
  ngayBatDau?: string;

  @IsOptional()
  @IsEnum(['Nam', 'Nữ', 'Khác'])
  gioiTinh?: 'Nam' | 'Nữ' | 'Khác';

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(65)
  tuoi?: number;

  @IsOptional()
  @IsEnum(VaiTro, { message: 'Vai trò không hợp lệ' })
  vaiTro?: VaiTro;

  @IsOptional()
  @IsNumber()
  maPB?: number;
}
