import { IsString, IsNumber, IsNotEmpty, IsEnum } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  tier: string; // e.g., "Monthly KES 1000 Landlord"

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  paymentMethod?: string;
}
