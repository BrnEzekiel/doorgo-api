import { Injectable, NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { ConfirmServiceCompletionDto } from './dto/confirm-service-completion.dto';
import { UpdateServiceBookingDto } from './dto/update-service-booking.dto';
import { PaymentService } from '../payment/payment.service';
import { NotificationService } from '../notification/notification.service';
import { Service } from '@prisma/client'; // Import Service model for typing

@Injectable()
export class ServiceBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
  ) {}

  async createServiceBooking(createServiceBookingDto: CreateServiceBookingDto) {
    const { serviceId, tenantId, bookingTime, amountPaid } = createServiceBookingDto;

    const service = await this.prisma.service.findUnique({ where: { id: serviceId }, include: { provider: true } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const tenant = await this.prisma.user.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const serviceBooking = await this.prisma.serviceBooking.create({
      data: {
        serviceId: serviceId, // Connect using serviceId directly
        tenant: { connect: { id: tenantId } },
        bookingTime,
        amountPaid,
        status: 'pending',
        confirmationStatus: 'pending',
        releaseStatus: 'pending',
      },
    });

    // Initiate payment for the service booking
    const payment = await this.paymentService.initiatePayment({
      serviceBookingId: serviceBooking.id,
      amount: amountPaid,
      phone: tenant.phone, // Assuming tenant phone for payment
    });

    await this.prisma.serviceBooking.update({
      where: { id: serviceBooking.id },
      data: { paymentId: payment.paymentId },
    });

    await this.notificationService.sendWhatsAppNotification(
      tenant.phone,
      `Your service (${service.name}) has been booked for ${bookingTime.toDateString()}. Payment initiated.`
    );
    await this.notificationService.sendWhatsAppNotification(
      service.provider.phone,
      `A new service booking for ${service.name} has been made by ${tenant.phone}.`
    );

    return serviceBooking;
  }

  findAll() {
    return this.prisma.serviceBooking.findMany({
      include: {
        tenant: true,
        payment: true,
      },
    });
  }

  findByTenantId(tenantId: string) {
    return this.prisma.serviceBooking.findMany({
      where: { tenantId },
      include: {
        tenant: true,
        payment: true,
      },
    });
  }

  async findByProviderId(providerId: string) {
    // First, find all services provided by this provider
    const services = await this.prisma.service.findMany({
      where: { providerId },
      select: { id: true }, // Select only the ID
    });
    const serviceIds = services.map(s => s.id);

    return this.prisma.serviceBooking.findMany({
      where: { serviceId: { in: serviceIds } }, // Filter by service IDs
      include: {
        tenant: true,
        payment: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.serviceBooking.findUnique({
      where: { id },
      include: {
        tenant: true,
        payment: true,
      },
    });
  }

  async update(id: string, updateServiceBookingDto: UpdateServiceBookingDto) {
    const { status } = updateServiceBookingDto;
    return this.prisma.serviceBooking.update({
      where: { id },
      data: { status },
    });
  }

  async confirmServiceCompletion(id: string, confirmServiceCompletionDto: ConfirmServiceCompletionDto) {
    const { actorId, role } = confirmServiceCompletionDto;

    const serviceBooking = await this.prisma.serviceBooking.findUnique({
      where: { id },
      include: { tenant: true }, // Include tenant for notifications
    });

    if (!serviceBooking) {
      throw new NotFoundException('Service booking not found');
    }

    // Explicitly fetch the service and provider for checks and notifications
    const service = await this.prisma.service.findUnique({
      where: { id: serviceBooking.serviceId },
      include: { provider: true },
    });
    if (!service) {
      throw new NotFoundException('Service associated with booking not found.');
    }


    let updatedConfirmationStatus = serviceBooking.confirmationStatus;

    if (role === 'tenant') {
      if (serviceBooking.tenantId !== actorId) {
        throw new UnauthorizedException('Only the booked tenant can confirm completion.');
      }
      if (serviceBooking.confirmationStatus === 'pending') {
        updatedConfirmationStatus = 'confirmed_by_tenant';
      } else if (serviceBooking.confirmationStatus === 'confirmed_by_provider') {
        updatedConfirmationStatus = 'confirmed_by_tenant_and_provider';
      }
    }
    else if (role === 'provider') {
      if (service.provider.id !== actorId) {
        throw new UnauthorizedException('Only the service provider can confirm completion.');
      }
      if (serviceBooking.confirmationStatus === 'pending') {
        updatedConfirmationStatus = 'confirmed_by_provider';
      } else if (serviceBooking.confirmationStatus === 'confirmed_by_tenant') {
        updatedConfirmationStatus = 'confirmed_by_tenant_and_provider';
      }
    } else {
      throw new BadRequestException('Invalid role for confirmation.');
    }

    // If both confirmed, release funds and credit provider
    if (updatedConfirmationStatus === 'confirmed_by_tenant_and_provider') {
      const updatedBooking = await this.prisma.serviceBooking.update({
        where: { id },
        data: {
          confirmationStatus: updatedConfirmationStatus,
          status: 'completed',
          releaseStatus: 'released',
        },
      });

      const COMMISSION_RATE = 0.10; // 10% commission
      const amountPaidDecimal = new Decimal(updatedBooking.amountPaid);
      const commissionAmountDecimal = amountPaidDecimal.times(COMMISSION_RATE);
      const netAmountDecimal = amountPaidDecimal.minus(commissionAmountDecimal);

      // Credit the service provider's balance with the net amount
      await this.prisma.user.update({
        where: { id: service.provider.id },
        data: {
          balance: {
            increment: netAmountDecimal, // Add the net amount to the provider's balance
          },
        },
      });

      // Create a CommissionRecord
      await this.prisma.commissionRecord.create({
        data: {
          serviceBooking: { connect: { id: updatedBooking.id } },
          provider: { connect: { id: service.provider.id } },
          amountPaid: amountPaidDecimal,
          commissionRate: new Decimal(COMMISSION_RATE),
          commissionAmount: commissionAmountDecimal,
          netAmount: netAmountDecimal,
        },
      });

      await this.notificationService.sendWhatsAppNotification(
        serviceBooking.tenant.phone,
        `Your service (${service.name}) is completed and funds have been released to the provider.`
      );
      await this.notificationService.sendWhatsAppNotification(
        service.provider.phone,
        `Funds for service (${service.name}) have been released and credited to your balance.`
      );
      return { message: 'Service completed, funds released and provider balance credited.' };
    } else {
      await this.prisma.serviceBooking.update({
        where: { id },
        data: { confirmationStatus: updatedConfirmationStatus },
      });
      return { message: `Confirmation received from ${role}. Waiting for other party.` };
    }
  }

  async cancel(id: string) {
    const serviceBooking = await this.prisma.serviceBooking.findUnique({
      where: { id },
    });

    if (!serviceBooking) {
      throw new NotFoundException('Service booking not found');
    }

    // Fetch service for notification details
    const service = await this.prisma.service.findUnique({
      where: { id: serviceBooking.serviceId },
    });
    // Ensure service is found for notification, though not strictly required for cancel logic
    const serviceName = service ? service.name : 'Unknown Service';


    // TODO: Implement refund logic if necessary

    return this.prisma.serviceBooking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}