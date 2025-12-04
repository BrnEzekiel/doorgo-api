import { IsString, IsOptional } from 'class-validator';

export class UpdateChecklistDto {
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  damageNotes?: string;
}
