import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class UpdateBookingTenantsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  newTenantIds: string[];
}
