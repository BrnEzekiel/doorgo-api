import { Module } from '@nestjs/common';
import { RentStatusService } from './rent-status.service';
import { RentStatusController } from './rent-status.controller';
import { HostelModule } from '../hostel/hostel.module'; // Import HostelModule

@Module({
  imports: [HostelModule], // Import HostelModule
  controllers: [RentStatusController],
  providers: [RentStatusService],
  exports: [RentStatusService],
})
export class RentStatusModule {}
