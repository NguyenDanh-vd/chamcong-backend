import { PartialType } from '@nestjs/mapped-types';
import { CreateNhanVienDto } from './create-nhanvien.dto';

// Chỉ cần như vậy là đủ!
export class UpdateNhanvienDto extends PartialType(CreateNhanVienDto) {}