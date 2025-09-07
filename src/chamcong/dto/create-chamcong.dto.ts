import { IsNotEmpty, IsOptional, IsString, IsInt, IsNumber } from 'class-validator';

export class CreateChamCongDto {
  @IsInt()
  @IsNotEmpty()
  maNV: number;

  @IsInt()
  @IsOptional()
  maCa?: number;

  @IsString()
  @IsOptional()
  gioVao?: string; // client gửi ISO string

  @IsString()
  @IsOptional()
  gioRa?: string;

  @IsString()
  @IsNotEmpty()
  trangThai: string; 
  // hop-le | tre | vang-mat | chua-xac-nhan

  @IsString()
  @IsOptional()
  hinhThuc?: string; 
  // faceid | gps | manual | faceid+gps

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
