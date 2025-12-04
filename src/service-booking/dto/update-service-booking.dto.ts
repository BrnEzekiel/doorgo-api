import { IsString, IsOptional } from 'class-validator';

export class UpdateServiceBookingDto {
  @IsString()
  @IsOptional()
  status?: string;
}
