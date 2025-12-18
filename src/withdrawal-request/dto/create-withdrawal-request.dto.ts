import { IsNumber, IsString, Min } from 'class-validator';

export class CreateWithdrawalRequestDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  paymentMethod: string;
}
