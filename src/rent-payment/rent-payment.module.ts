import { Module } from '@nestjs/common';
import { RentPaymentService } from './rent-payment.service';
import { RentPaymentController } from './rent-payment.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RentPaymentController],
  providers: [RentPaymentService],
  exports: [RentPaymentService],
})
export class RentPaymentModule {}
