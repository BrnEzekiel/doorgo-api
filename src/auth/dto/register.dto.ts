// src/auth/dto/register.dto.ts
import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  role: string; // e.g., 'student', 'landlord', 'service_provider'

  @IsString()
  @IsOptional()
  university?: string; // For student role

  @IsString()
  @IsOptional()
  phone?: string; // For landlords/service providers or if phone is still relevant

  // Add other role-specific fields as needed
}
