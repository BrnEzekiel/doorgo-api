import { Module } from '@nestjs/common';
import { MaintenanceRequestService } from './maintenance-request.service';
import { MaintenanceRequestController } from './maintenance-request.controller';

@Module({
  controllers: [MaintenanceRequestController],
  providers: [MaintenanceRequestService],
  exports: [MaintenanceRequestService],
})
export class MaintenanceRequestModule {}
