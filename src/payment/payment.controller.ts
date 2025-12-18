import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  initiatePayment(@Body() initiatePaymentDto: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(initiatePaymentDto);
  }

  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Get(':id/status')
  getPaymentStatus(@Param('id') id: string) {
    return this.paymentService.getPaymentStatus(id);
  }

  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    return this.paymentService.handleWebhook(payload);
  }

  // M-Pesa STK Push Callback URL - called by Safaricom
  @Post('mpesa/stkpush/callback')
  async handleMpesaStkCallback(@Body() callbackData: any) {
    // Safaricom sends M-Pesa STK Push results to this endpoint
    // Log the callback data for debugging
    console.log('M-Pesa STK Push Callback Received:', callbackData);

    // Extract relevant data and pass to service
    const { Body: { stkCallback: { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } } } = callbackData;

    return this.paymentService.handleMpesaStkCallback({
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    });
  }

  // M-Pesa C2B (Customer to Business) Callback URL - called by Safaricom
  @Post('mpesa/c2b/callback')
  async handleMpesaC2bCallback(@Body() callbackData: any) {
    // Safaricom sends M-Pesa C2B (Lipa Na M-Pesa) results to this endpoint
    // Log the callback data for debugging
    console.log('M-Pesa C2B Callback Received:', callbackData);

    // Extract relevant data and pass to service
    const { Body: { stkCallback: { TransID, TransAmount, MSISDN, BillRefNumber } } } = callbackData;

    return this.paymentService.handleMpesaC2bCallback({
      TransID,
      TransAmount,
      MSISDN,
      BillRefNumber,
    });
  }
}
