export class CreateServiceBookingDto {
  serviceId: string;
  tenantId: string;
  bookingTime: Date;
  amountPaid: number;
}
