import { IsString, IsNotEmpty, IsDateString, IsUrl } from 'class-validator';

export class CreateLeaseDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  hostelId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsUrl()
  @IsNotEmpty()
  documentUrl: string;
}
