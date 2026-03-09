import { IsArray, ArrayMinSize, ArrayMaxSize, IsNumber, IsString } from 'class-validator';

export class CreateFaceDatumDto {
  @IsArray()
  @ArrayMinSize(128)
  @ArrayMaxSize(128)
  faceDescriptor: number[];
}

export class RegisterFaceDto {
  @IsArray()
  @ArrayMinSize(1)
  images: string[];
}

export class PointFaceDto {
  @IsArray()
  @ArrayMinSize(128)
  @ArrayMaxSize(128)
  faceDescriptor: number[];

  @IsNumber()
  maCa: number;
}
