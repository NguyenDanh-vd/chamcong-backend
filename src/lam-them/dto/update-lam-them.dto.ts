import { PartialType } from '@nestjs/mapped-types';
import { CreateLamThemDto } from './create-lam-them.dto';

export class UpdateLamThemDto extends PartialType(CreateLamThemDto) {}
