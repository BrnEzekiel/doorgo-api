export class CreateRentPaymentDto {
  rentStatusId: string;
  amountPaid: number;
  paymentDate: Date;
  reference?: string;
}
