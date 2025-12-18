import { PartialType } from '@nestjs/mapped-types';
import { CreateSmsBundleDto } from './create-sms-bundle.dto';
import { IsString, IsEnum } from 'class-validator';
import { SmsBundleStatus } from '@prisma/client';

export class UpdateSmsBundleDto extends PartialType(CreateSmsBundleDto) {
  @IsString()
  @IsEnum(SmsBundleStatus)
  status?: SmsBundleStatus;
}
