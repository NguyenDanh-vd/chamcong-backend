import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLamThemDto {
  @IsDateString()
  @IsNotEmpty()
  ngayLT: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'gioBatDau must be a valid time (HH:mm or HH:mm:ss)',
  })
  gioBatDau: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'gioKetThuc must be a valid time (HH:mm or HH:mm:ss)',
  })
  gioKetThuc: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  soGio?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ghiChu?: string;
}
