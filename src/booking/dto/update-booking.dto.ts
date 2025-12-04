import { IsString, IsOptional } from 'class-validator';

export class UpdateBookingDto {
  @IsString()
  @IsOptional()
  status?: string;
}
