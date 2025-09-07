import { PartialType } from '@nestjs/mapped-types';
import { CreateFaceDatumDto } from './create-face-datum.dto';

export class UpdateFaceDatumDto extends PartialType(CreateFaceDatumDto) {}
