import { PartialType } from '@nestjs/mapped-types';
import { CreateRentStatusDto } from './create-rent-status.dto';

export class UpdateRentStatusDto extends PartialType(CreateRentStatusDto) {}
