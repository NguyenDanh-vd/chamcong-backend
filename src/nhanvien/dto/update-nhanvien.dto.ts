import { PartialType } from '@nestjs/mapped-types';
import { CreateNhanVienDto } from './create-nhanvien.dto';

export class UpdateNhanvienDto extends PartialType(CreateNhanVienDto) {}