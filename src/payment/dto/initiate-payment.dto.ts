export class InitiatePaymentDto {
  invoiceId?: string;
  serviceBookingId?: string;
  subscriptionId?: string;
  boostId?: string; // Add boostId
  smsBundleId?: string;
  userId?: string;
  amount: number;
  phone: string;
}
