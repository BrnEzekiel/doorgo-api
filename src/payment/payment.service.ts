import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { SubscriptionStatus } from '@prisma/client'; // Import SubscriptionStatus

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async initiatePayment(initiatePaymentDto: InitiatePaymentDto) {
    const { amount, phone, invoiceId, serviceBookingId, subscriptionId, userId } = initiatePaymentDto;

    // --- REAL PAYMENT GATEWAY INTEGRATION WOULD GO HERE ---
    // This is a simulated M-Pesa STK Push initiation.
    // In a production environment, you would call your M-Pesa API client here.
    // Example for M-Pesa STK Push:
    // const mpesaResponse = await this.mpesaService.stkPush({
    //   amount: amount,
    //   phoneNumber: phone,
    //   transactionDesc: 'Doorgo Payment',
    //   callbackUrl: 'YOUR_WEBHOOK_URL/payment/mpesa/callback', // Use a specific callback URL
    //   accountReference: `DRG-${invoiceId || serviceBookingId || subscriptionId}`,
    //   // Add other necessary M-Pesa specific parameters
    // });
    // const transactionId = mpesaResponse.CheckoutRequestID; // Or similar ID from M-Pesa

    // For simulation, generate a mock transaction ID
    const transactionId = `MPESA_SIM_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    // Simulate successful initiation (STK Push sent to phone)
    const simulatedInitiationSuccess = true;

    if (!simulatedInitiationSuccess) {
        throw new BadRequestException('Payment initiation failed. Please try again.');
    }
    // --- END REAL PAYMENT GATEWAY INTEGRATION ---

    // Create a pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        amount,
        phone,
        invoiceId,
        serviceBookingId,
        subscriptionId,
        transactionId,
        status: 'pending', // Payment status remains pending until webhook confirms
      },
    });

    // Return the payment ID and transaction ID for frontend polling or confirmation
    return {
      paymentId: payment.id,
      transactionId: payment.transactionId,
      message: 'M-Pesa STK Push initiated. Please check your phone for a prompt.',
    };
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

  async handleMpesaStkCallback(callbackData: any) {
    // In a real application, parse the STK Push callback from Safaricom
    // For simulation, we expect { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc }
    const { CheckoutRequestID, ResultCode, ResultDesc } = callbackData;

    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: CheckoutRequestID }, // Using CheckoutRequestID as our transactionId
    });

    if (!payment) {
      console.error(`STK Push: Payment with CheckoutRequestID ${CheckoutRequestID} not found`);
      return { success: false, message: 'Payment not found' };
    }

    const newStatus = ResultCode === 0 ? 'completed' : 'failed'; // ResultCode 0 for success

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus },
    });

    // Trigger updates for associated entities (Invoice, ServiceBooking, Subscription, SmsBundle)
    if (newStatus === 'completed') {
      if (payment.invoiceId) {
        await this.prisma.invoice.update({ where: { id: payment.invoiceId }, data: { status: 'paid' } });
      }
      if (payment.serviceBookingId) {
        // Handle service booking completion logic here if needed
      }
      if (payment.subscriptionId) {
        // Trigger subscription activation
        // Note: this would ideally be done via an event or direct call to SubscriptionService
      }
      if (payment.smsBundleId) {
        // Trigger SMS bundle activation
        // Note: this would ideally be done via an event or direct call to SmsBundleService
      }
    }
    return { success: true, message: 'STK Push callback processed' };
  }

  async handleMpesaC2bCallback(callbackData: any) {
    // In a real application, parse the C2B callback from Safaricom
    // For simulation, we expect { TransID, TransAmount, MSISDN, BillRefNumber }
    const { TransID, TransAmount, MSISDN, BillRefNumber } = callbackData;

    // Logic to find the corresponding invoice/booking based on BillRefNumber
    // and update its status. This is more complex as BillRefNumber might be arbitrary.
    // For now, let's just log and create a new payment if not found.

    let payment = await this.prisma.payment.findFirst({
        where: { transactionId: TransID }, // Check if payment already recorded by TransID
    });

    if (!payment) {
        // Try to match by BillRefNumber to an existing pending invoice or subscription
        const relatedInvoice = await this.prisma.invoice.findFirst({
            where: { id: BillRefNumber, status: 'pending' }, // Assuming BillRefNumber is Invoice ID
        });

        const relatedSubscription = await this.prisma.subscription.findFirst({
            where: { id: BillRefNumber, status: 'PENDING' as SubscriptionStatus }, // Assuming BillRefNumber is Subscription ID
        });

        if (relatedInvoice || relatedSubscription) {
             payment = await this.prisma.payment.create({
                data: {
                    amount: parseFloat(TransAmount),
                    phone: MSISDN,
                    transactionId: TransID,
                    status: 'completed',
                    invoiceId: relatedInvoice ? relatedInvoice.id : null,
                    subscriptionId: relatedSubscription ? relatedSubscription.id : null,
                },
            });
            if (relatedInvoice) {
                await this.prisma.invoice.update({ where: { id: relatedInvoice.id }, data: { status: 'paid' } });
            }
            if (relatedSubscription) {
                // Trigger subscription activation
            }
        } else {
            // Unmatched payment, could be an error or a future invoice
            console.warn(`C2B: Unmatched payment. TransID: ${TransID}, Amount: ${TransAmount}, MSISDN: ${MSISDN}, BillRefNumber: ${BillRefNumber}`);
            // Optionally create a generic payment record
             payment = await this.prisma.payment.create({
                data: {
                    amount: parseFloat(TransAmount),
                    phone: MSISDN,
                    transactionId: TransID,
                    status: 'completed',
                    description: `C2B Payment - BillRef: ${BillRefNumber}`,
                },
            });
        }
    } else if (payment.status === 'pending') {
        // Update status if already initiated as pending
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'completed' },
        });
        if (payment.invoiceId) {
            await this.prisma.invoice.update({ where: { id: payment.invoiceId }, data: { status: 'paid' } });
        }
        if (payment.subscriptionId) {
            // Trigger subscription activation
        }
    }
    return { success: true, message: 'C2B callback processed' };
  }
}

