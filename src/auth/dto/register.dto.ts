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
  role: string; // e.g., 'tenant', 'landlord', 'service_provider'

  @IsString()
  @IsNotEmpty()
  phone: string; // Made required for registration flow

  // Add other role-specific fields as needed
}
