import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  role?: string[];

  // Optional fields for user profile details (can be set during update)
  @IsOptional()
  @IsString()
  password?: string; // Not set during initial user creation, but can be part of data for updates

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioImageUrls?: string[];
}
