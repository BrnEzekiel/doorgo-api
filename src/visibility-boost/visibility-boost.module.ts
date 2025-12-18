import { Module } from '@nestjs/common';
import { VisibilityBoostService } from './visibility-boost.service';
import { VisibilityBoostController } from './visibility-boost.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Module({
  controllers: [VisibilityBoostController],
  providers: [VisibilityBoostService, PrismaService, PaymentService],
  exports: [VisibilityBoostService],
})
export class VisibilityBoostModule {}
