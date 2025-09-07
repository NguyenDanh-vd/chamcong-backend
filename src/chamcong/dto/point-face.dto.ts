import {
  IsArray,
  IsNumber,
  IsOptional,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class PointFaceDto {
  @IsNumber()
  maNV: number;

  // maCa có thể có hoặc không
  @IsOptional()
  @IsNumber()
  maCa?: number;

  // ✅ mỗi phần tử trong mảng phải là số
  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor: number[];

  @IsLatitude({ message: 'Vĩ độ (latitude) không hợp lệ.' })
  latitude: number;

  @IsLongitude({ message: 'Kinh độ (longitude) không hợp lệ.' })
  longitude: number;
}
