import { PartialType } from '@nestjs/mapped-types';
import { CreateVisibilityBoostDto } from './create-visibility-boost.dto';
import { IsString, IsEnum } from 'class-validator';
import { BoostStatus } from '@prisma/client';

export class UpdateVisibilityBoostDto extends PartialType(CreateVisibilityBoostDto) {
  @IsString()
  @IsEnum(BoostStatus)
  status?: BoostStatus;
}
