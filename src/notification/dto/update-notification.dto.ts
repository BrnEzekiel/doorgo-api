import { IsString, IsOptional, IsDate } from 'class-validator';

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  readAt?: Date;
}
