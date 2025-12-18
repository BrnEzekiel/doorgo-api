import { Module } from '@nestjs/common';
import { SmsBundleService } from './sms-bundle.service';
import { SmsBundleController } from './sms-bundle.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Module({
  controllers: [SmsBundleController],
  providers: [SmsBundleService, PrismaService, PaymentService],
  exports: [SmsBundleService],
})
export class SmsBundleModule {}
