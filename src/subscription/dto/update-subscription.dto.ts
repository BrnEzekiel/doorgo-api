import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriptionDto } from './create-subscription.dto';
import { IsString, IsEnum } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
  @IsString()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
