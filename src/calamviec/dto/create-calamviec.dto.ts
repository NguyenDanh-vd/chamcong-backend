import { IsString, IsBoolean, Matches } from 'class-validator';

export class CreateCaLamViecDto {
  @IsString()
  tenCa: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ bắt đầu phải có dạng HH:mm',
  })
  gioBatDau: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ kết thúc phải có dạng HH:mm',
  })
  gioKetThuc: string;

  @IsBoolean()
  trangThai: boolean;
}
