import { PartialType } from '@nestjs/mapped-types';
import { CreateUtilityBillDto } from './create-utility-bill.dto';

export class UpdateUtilityBillDto extends PartialType(CreateUtilityBillDto) {}
