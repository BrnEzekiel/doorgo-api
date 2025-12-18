import { Module } from '@nestjs/common';
import { LeaseService } from './lease.service';
import { LeaseController } from './lease.controller';
import { HostelModule } from '../hostel/hostel.module'; // Import HostelModule

@Module({
  imports: [HostelModule], // Import HostelModule
  controllers: [LeaseController],
  providers: [LeaseService],
  exports: [LeaseService],
})
export class LeaseModule {}
