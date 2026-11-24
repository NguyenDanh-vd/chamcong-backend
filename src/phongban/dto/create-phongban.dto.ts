import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePhongbanDto {
  @IsString({ message: 'Tên phòng ban phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên phòng ban không được để trống' })
  tenPhong: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  moTa?: string;
}
