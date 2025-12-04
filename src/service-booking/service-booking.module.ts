import { Module } from '@nestjs/common';
import { ServiceBookingService } from './service-booking.service';
import { ServiceBookingController } from './service-booking.controller';
import { PaymentModule } from '../payment/payment.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PaymentModule, NotificationModule],
  providers: [ServiceBookingService],
  controllers: [ServiceBookingController],
})
export class ServiceBookingModule {}

