import { PartialType } from '@nestjs/mapped-types';
import { CreateCaLamViecDto } from './create-calamviec.dto';

export class UpdateCaLamViecDto extends PartialType(CreateCaLamViecDto) {}
