import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { HostelModule } from './hostel/hostel.module';
import { BookingModule } from './booking/booking.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { PaymentModule } from './payment/payment.module';
import { ChecklistModule } from './checklist/checklist.module';
import { ServiceCategoryModule } from './service-category/service-category.module';
import { ServiceModule } from './service/service.module';
import { ServiceBookingModule } from './service-booking/service-booking.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { InvoiceModule } from './invoice/invoice.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module'; // Import CloudinaryModule
import { RentStatusModule } from './rent-status/rent-status.module';
import { UtilityBillModule } from './utility-bill/utility-bill.module';
import { LeaseModule } from './lease/lease.module';
import { MaintenanceRequestModule } from './maintenance-request/maintenance-request.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { RentPaymentModule } from './rent-payment/rent-payment.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    PrismaModule,
    UserModule,
    HostelModule,
    BookingModule,
    SchedulerModule,
    PaymentModule,
    ChecklistModule,
    ServiceCategoryModule,
    ServiceModule,
    ServiceBookingModule,
    NotificationModule,
    AdminModule,
    InvoiceModule,
    CloudinaryModule,
    RentStatusModule,
    UtilityBillModule,
    LeaseModule,
    MaintenanceRequestModule,
    AnnouncementModule,
    RentPaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

