import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateMaintenanceRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  hostelId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @IsString()
  @IsOptional()
  status?: string; // New: Add status for initial creation (optional) or for updates
}
