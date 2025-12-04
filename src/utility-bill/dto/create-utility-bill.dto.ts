import { IsString, IsNotEmpty, IsDateString, IsNumber, IsIn } from 'class-validator';

export class CreateUtilityBillDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  hostelId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsIn(['Due', 'Paid'])
  status: string = 'Due';
}
