import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateSmsBundleDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  bundleName: string; // e.g., "Small SMS Pack", "Medium SMS Pack"

  @IsNumber()
  @IsNotEmpty()
  smsCount: number; // Number of SMS in the bundle

  @IsNumber()
  @IsNotEmpty()
  price: number;
}
