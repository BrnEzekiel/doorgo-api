export class InitiatePaymentDto {
  invoiceId?: string;
  serviceBookingId?: string;
  amount: number;
  phone: string;
}
