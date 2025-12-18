import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module'; // Import PrismaModule
import { NotificationModule } from '../notification/notification.module'; // Import NotificationModule

@Module({
  imports: [PrismaModule, NotificationModule], // Add required modules
  providers: [SchedulerService]
})
export class SchedulerModule {}
