import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PrismaService, PaymentService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
