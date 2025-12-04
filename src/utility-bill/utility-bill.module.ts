import { Module } from '@nestjs/common';
import { UtilityBillService } from './utility-bill.service';
import { UtilityBillController } from './utility-bill.controller';

@Module({
  controllers: [UtilityBillController],
  providers: [UtilityBillService],
  exports: [UtilityBillService],
})
export class UtilityBillModule {}
