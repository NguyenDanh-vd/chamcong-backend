import { IsString } from 'class-validator';

export class FaceLoginDto {
  @IsString()
  imageBase64: string;
}