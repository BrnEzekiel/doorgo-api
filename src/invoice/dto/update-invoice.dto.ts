import { IsString, IsOptional } from 'class-validator';

export class UpdateInvoiceDto {
  @IsString()
  @IsOptional()
  status?: string;
}
