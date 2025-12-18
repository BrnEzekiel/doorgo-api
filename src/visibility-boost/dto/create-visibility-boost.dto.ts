import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateVisibilityBoostDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsNumber()
  @IsNotEmpty()
  durationDays: number; // e.g., 7 for a week

  @IsNumber()
  @IsNotEmpty()
  price: number;
}
