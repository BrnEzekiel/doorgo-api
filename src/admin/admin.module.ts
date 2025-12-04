import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { HostelModule } from '../hostel/hostel.module';
import { ServiceCategoryModule } from '../service-category/service-category.module';
import { BookingModule } from '../booking/booking.module';
import { UserModule } from '../user/user.module';
import { ServiceModule } from '../service/service.module';

@Module({
  imports: [HostelModule, ServiceCategoryModule, BookingModule, UserModule, ServiceModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}

