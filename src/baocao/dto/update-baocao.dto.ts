import { PartialType } from '@nestjs/mapped-types';
import { CreateBaocaoDto } from './create-baocao.dto';

export class UpdateBaocaoDto extends PartialType(CreateBaocaoDto) {}
