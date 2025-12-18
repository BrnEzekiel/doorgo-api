import { Module } from '@nestjs/common';
import { MaintenanceRequestService } from './maintenance-request.service';
import { MaintenanceRequestController } from './maintenance-request.controller';
import { HostelModule } from '../hostel/hostel.module'; // Import HostelModule

@Module({
  imports: [HostelModule], // Import HostelModule
  controllers: [MaintenanceRequestController],
  providers: [MaintenanceRequestService],
  exports: [MaintenanceRequestService],
})
export class MaintenanceRequestModule {}
