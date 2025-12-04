import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [BookingService],
  controllers: [BookingController],
  exports: [BookingService], // Export BookingService
})
export class BookingModule {}

