import { Module } from '@nestjs/common';
import { RentStatusService } from './rent-status.service';
import { RentStatusController } from './rent-status.controller';

@Module({
  controllers: [RentStatusController],
  providers: [RentStatusService],
  exports: [RentStatusService],
})
export class RentStatusModule {}
