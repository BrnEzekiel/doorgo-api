import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async initiatePayment(initiatePaymentDto: InitiatePaymentDto) {
    // In a real application, you would call the M-Pesa API here
    const transactionId = `MPESA_${Date.now()}`;

    const payment = await this.prisma.payment.create({
      data: {
        ...initiatePaymentDto,
        transactionId,
        status: 'pending',
      },
    });

    return payment;
  }

  private async handleMpesaCallback(callbackData: { transactionId: string; success: boolean }) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: callbackData.transactionId },
    });

    if (!payment) {
      // In a real app, you would have more robust error handling
      console.error(`Payment with transactionId ${callbackData.transactionId} not found`);
      return;
    }

    const status = callbackData.success ? 'completed' : 'failed';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    });

    if (callbackData.success && payment.invoiceId) {
      await this.prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'paid' },
      });
    }
  }

  async getPaymentStatus(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  findAll() {
    return this.prisma.payment.findMany();
  }

  findOne(id: string) {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async handleWebhook(payload: any) {
    // This is a mock implementation. In a real application, you would validate the payload
    // and handle different event types from the payment provider.
    const { transactionId, success } = payload;
    await this.handleMpesaCallback({ transactionId, success });
    return { status: 'success' };
  }
}

