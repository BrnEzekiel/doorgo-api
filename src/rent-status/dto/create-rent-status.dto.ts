import { IsString, IsNotEmpty, IsDateString, IsNumber } from 'class-validator';

export class CreateRentStatusDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  hostelId: string;

  @IsNumber()
  @IsNotEmpty()
  rentAmount: number;

  @IsDateString()
  @IsNotEmpty()
  nextDueDate: string;
}
