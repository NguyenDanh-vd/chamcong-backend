import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNghiPhepDto {
  @IsDateString()
  @IsNotEmpty()
  ngayBatDau: string;

  @IsDateString()
  @IsNotEmpty()
  ngayKetThuc: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  lyDo: string;
}
