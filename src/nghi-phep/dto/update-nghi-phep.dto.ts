import { PartialType } from '@nestjs/mapped-types';
import { CreateNghiPhepDto } from './create-nghi-phep.dto';

export class UpdateNghiPhepDto extends PartialType(CreateNghiPhepDto) {}
