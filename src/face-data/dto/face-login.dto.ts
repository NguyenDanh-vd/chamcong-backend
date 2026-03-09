import { IsString, IsNumber } from 'class-validator';

export class FaceLoginDto {
  @IsString()
  imageBase64: string;

  @IsNumber()
  maCa: number;
}