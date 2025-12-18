import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerModuleOptions } from '@nestjs/throttler/dist/throttler-module-options.interface';
import { ThrottlerStorage } from '@nestjs/throttler/dist/throttler-storage.interface';
import { THROTTLER_OPTIONS } from '@nestjs/throttler/dist/throttler.constants';
import { APP_GUARD, Reflector } from '@nestjs/core'; // Import Reflector

// Custom modules
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
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { RentStatusModule } from './rent-status/rent-status.module';
import { UtilityBillModule } from './utility-bill/utility-bill.module';
import { LeaseModule } from './lease/lease.module';
import { MaintenanceRequestModule } from './maintenance-request/maintenance-request.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { RentPaymentModule } from './rent-payment/rent-payment.module';
import { ActivityModule } from './activity/activity.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { VisibilityBoostModule } from './visibility-boost/visibility-boost.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SmsBundleModule } from './sms-bundle/sms-bundle.module';
import { AuditModule } from './audit/audit.module';
import { ReceiptModule } from './receipt/receipt.module';
import { ReviewModule } from './review/review.module';
import { WithdrawalRequestModule } from './withdrawal-request/withdrawal-request.module';
import { SearchModule } from './search/search.module';
import { NotificationCenterModule } from './notification-center/notification-center.module';

// Custom services/guards for global providers
import { AuditService } from './audit/audit.service'; // Added this import
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { CustomLoggerService } from './common/logger/custom-logger.service';
import { ConfigModule } from '@nestjs/config'; // ConfigModule needs to be imported
import { CacheConfigModule } from './cache/cache.module'; // CacheConfigModule needs to be imported


@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [ // Wrap options in 'throttlers' array
        {
          ttl: 60000, // 60 seconds
          limit: 30, // 30 requests per 60 seconds per IP
        },
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
    }),
    CacheConfigModule, // Integrate CacheConfigModule
    AuthModule,
    PrismaModule,
    AuditModule, // Move AuditModule before UserModule
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
    ActivityModule,
    SubscriptionModule,
    VisibilityBoostModule,
    AnalyticsModule,
    SmsBundleModule,
    ReceiptModule,
    ReviewModule,
    WithdrawalRequestModule,
    SearchModule,
    NotificationCenterModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useFactory: (
        reflector: Reflector,
        auditService: AuditService,
        options: ThrottlerModuleOptions, // Now expecting a single object
        storageService: ThrottlerStorage,
      ) => {
        // options is now the single object passed to forRoot, containing the throttlers array
        return new CustomThrottlerGuard(
          auditService,
          options, // Pass the entire options object
          storageService,
          reflector,
        );
      },
      inject: [Reflector, AuditService, THROTTLER_OPTIONS, ThrottlerStorage], // Inject actual instances
    },
    CustomLoggerService, // Provide CustomLoggerService globally
  ],
})
export class AppModule {}