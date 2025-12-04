import { Injectable, NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { ConfirmServiceCompletionDto } from './dto/confirm-service-completion.dto';
import { UpdateServiceBookingDto } from './dto/update-service-booking.dto';
import { PaymentService } from '../payment/payment.service';
import { NotificationService } from '../notification/notification.service';
import { Service } from '@prisma/client';

@Injectable()
export class ServiceBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
  ) {}

  async createServiceBooking(createServiceBookingDto: CreateServiceBookingDto) {
    const { serviceId, studentId, bookingTime, amountPaid } = createServiceBookingDto;

    const service = await this.prisma.service.findUnique({ where: { id: serviceId }, include: { provider: true } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const serviceBooking = await this.prisma.serviceBooking.create({
      data: {
        service: { connect: { id: serviceId } },
        student: { connect: { id: studentId } },
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
      phone: student.phone, // Assuming student phone for payment
    });

    await this.prisma.serviceBooking.update({
      where: { id: serviceBooking.id },
      data: { paymentId: payment.id },
    });

    await this.notificationService.sendWhatsAppNotification(
      student.phone,
      `Your service (${service.name}) has been booked for ${bookingTime.toDateString()}. Payment initiated.`
    );
    await this.notificationService.sendWhatsAppNotification(
      service.provider.phone,
      `A new service booking for ${service.name} has been made by ${student.phone}.`
    );

    return serviceBooking;
  }

  findAll() {
    return this.prisma.serviceBooking.findMany({
      include: {
        service: true,
        student: true,
        payment: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.serviceBooking.findUnique({
      where: { id },
      include: {
        service: true,
        student: true,
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
      include: { service: { include: { provider: true } }, student: true },
    });

    if (!serviceBooking) {
      throw new NotFoundException('Service booking not found');
    }

    let updatedConfirmationStatus = serviceBooking.confirmationStatus;

    if (role === 'student') {
      if (serviceBooking.studentId !== actorId) {
        throw new UnauthorizedException('Only the booked student can confirm completion.');
      }
      if (serviceBooking.confirmationStatus === 'pending') {
        updatedConfirmationStatus = 'confirmed_by_student';
      } else if (serviceBooking.confirmationStatus === 'confirmed_by_provider') {
        updatedConfirmationStatus = 'confirmed_by_student_and_provider';
      }
    }
    else if (role === 'provider') {
      if (serviceBooking.service.providerId !== actorId) {
        throw new UnauthorizedException('Only the service provider can confirm completion.');
      }
      if (serviceBooking.confirmationStatus === 'pending') {
        updatedConfirmationStatus = 'confirmed_by_provider';
      } else if (serviceBooking.confirmationStatus === 'confirmed_by_student') {
        updatedConfirmationStatus = 'confirmed_by_student_and_provider';
      }
    } else {
      throw new BadRequestException('Invalid role for confirmation.');
    }

    // If both confirmed, release funds and credit provider
    if (updatedConfirmationStatus === 'confirmed_by_student_and_provider') {
      const updatedBooking = await this.prisma.serviceBooking.update({
        where: { id },
        data: {
          confirmationStatus: updatedConfirmationStatus,
          status: 'completed',
          releaseStatus: 'released',
        },
        include: { service: { include: { provider: true } } } // Include service and provider to get amountPaid and provider ID
      });

      // Credit the service provider's balance
      await this.prisma.user.update({
        where: { id: updatedBooking.service.provider.id },
        data: {
          balance: {
            increment: updatedBooking.amountPaid, // Add the amount paid by the student
          },
        },
      });

      await this.notificationService.sendWhatsAppNotification(
        serviceBooking.student.phone,
        `Your service (${serviceBooking.service.name}) is completed and funds have been released to the provider.`
      );
      await this.notificationService.sendWhatsAppNotification(
        serviceBooking.service.provider.phone,
        `Funds for service (${serviceBooking.service.name}) have been released and credited to your balance.`
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

    return this.prisma.serviceBooking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}

