import { Module } from '@nestjs/common';
import { UtilityBillService } from './utility-bill.service';
import { UtilityBillController } from './utility-bill.controller';
import { HostelModule } from '../hostel/hostel.module'; // Import HostelModule

@Module({
  imports: [HostelModule], // Import HostelModule
  controllers: [UtilityBillController],
  providers: [UtilityBillService],
  exports: [UtilityBillService],
})
export class UtilityBillModule {}
