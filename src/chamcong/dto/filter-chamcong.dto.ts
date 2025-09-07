import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class FilterChamCongDto {
  @IsOptional() 
  @IsString()   
  tuNgay?: string;

  @IsOptional()
  @IsString()
  denNgay?: string;

  @IsOptional()
  @IsNumberString()
  maNV?: number;

  @IsOptional()
  @IsString()
  trangThai?: string;
}