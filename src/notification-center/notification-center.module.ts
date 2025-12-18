import { Module } from '@nestjs/common';
import { NotificationCenterService } from './notification-center.service';
import { NotificationCenterController } from './notification-center.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationCenterController],
  providers: [NotificationCenterService],
  exports: [NotificationCenterService],
})
export class NotificationCenterModule {}
