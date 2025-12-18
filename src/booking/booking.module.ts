import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { NotificationModule } from '../notification/notification.module';
import { HostelModule } from '../hostel/hostel.module'; // Import HostelModule

@Module({
  imports: [NotificationModule, HostelModule], // Import HostelModule
  providers: [BookingService],
  controllers: [BookingController],
  exports: [BookingService], // Export BookingService
})
export class BookingModule {}

