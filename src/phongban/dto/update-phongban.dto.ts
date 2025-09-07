import { PartialType } from '@nestjs/mapped-types';
import { CreatePhongbanDto } from './create-phongban.dto';

export class UpdatePhongbanDto extends PartialType(CreatePhongbanDto) {}
