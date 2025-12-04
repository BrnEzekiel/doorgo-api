import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class RequestWithdrawalDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // e.g., M-Pesa number if different from registered
}
