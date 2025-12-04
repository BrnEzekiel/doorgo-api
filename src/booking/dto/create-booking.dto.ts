export class CreateBookingDto {
  tenantIds: string[];
  leadTenantId: string;
  roomId: string;
  startDate: Date;
  endDate: Date;
  billingCycle: 'monthly' | 'semester';
}
