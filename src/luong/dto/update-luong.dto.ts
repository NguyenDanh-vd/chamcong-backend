import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLuongDto {
  @IsOptional()
  @IsNumber()
  luongCoBan?: number;

  @IsOptional()
  @IsNumber()
  thuong?: number;

  @IsOptional()
  @IsNumber()
  phat?: number;

  @IsOptional()
  @IsNumber()
  lamThem?: number;

  @IsOptional()
  @IsString()
  trangThai?: string;
}
