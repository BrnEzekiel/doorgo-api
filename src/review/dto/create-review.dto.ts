import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsNotEmpty()
  maintenanceRequestId: string;

  @IsString()
  @IsNotEmpty()
  providerId: string;
}
