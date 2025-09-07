import { PartialType } from '@nestjs/mapped-types';
import { CreateChamCongDto } from './create-chamcong.dto';

export class UpdateChamCongDto extends PartialType(CreateChamCongDto) {}
