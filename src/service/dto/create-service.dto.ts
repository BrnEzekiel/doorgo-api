import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
  name: string;
  description?: string;
  price: number;
  providerId: string;
  categoryId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
