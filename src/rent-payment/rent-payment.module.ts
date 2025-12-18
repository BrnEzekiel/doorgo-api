import { Module } from '@nestjs/common';
import { RentPaymentService } from './rent-payment.service';
import { RentPaymentController } from './rent-payment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReceiptModule } from '../receipt/receipt.module'; // Import ReceiptModule

@Module({
  imports: [PrismaModule, ReceiptModule], // Import ReceiptModule
  controllers: [RentPaymentController],
  providers: [RentPaymentService],
  exports: [RentPaymentService],
})
export class RentPaymentModule {}
