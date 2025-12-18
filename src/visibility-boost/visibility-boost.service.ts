import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisibilityBoostDto } from './dto/create-visibility-boost.dto';
import { PaymentService } from '../payment/payment.service';
import { BoostStatus, Prisma } from '@prisma/client';

@Injectable()
export class VisibilityBoostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async create(createVisibilityBoostDto: CreateVisibilityBoostDto) {
    const { serviceId, providerId, durationDays, price } = createVisibilityBoostDto;

    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    const provider = await this.prisma.user.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw new NotFoundException('Provider not found.');
    }
    
    // Ensure the provider owns the service
    if (service.providerId !== providerId) {
      throw new BadRequestException('Provider does not own this service.');
    }

    const newBoost = await this.prisma.visibilityBoost.create({
      data: {
        service: { connect: { id: serviceId } },
        provider: { connect: { id: providerId } },
        durationDays,
        price: new Prisma.Decimal(price),
        status: BoostStatus.PENDING_PAYMENT,
        startDate: new Date(),
        endDate: new Date(),
      },
    });

    const paymentInitiation = await this.paymentService.initiatePayment({
      boostId: newBoost.id,
      amount: price,
      phone: provider.phone, // Assuming provider.phone is available for payment
    });

    // Update the boost with the payment transaction ID
    const updatedBoost = await this.prisma.visibilityBoost.update({
      where: { id: newBoost.id },
      data: {
        transactionId: paymentInitiation.transactionId,
      },
    });

    return {
      boost: updatedBoost,
      paymentInitiationDetails: paymentInitiation,
    };
  }

  async findAll() {
    return this.prisma.visibilityBoost.findMany(); // Removed service and provider include
  }

  async findOne(id: string) {
    const boost = await this.prisma.visibilityBoost.findUnique({
      where: { id },
      // Removed service and provider include
    });
    if (!boost) {
      throw new NotFoundException(`Visibility Boost with ID ${id} not found.`);
    }
    return boost;
  }

  async updateBoostStatus(id: string, status: BoostStatus) {
    const boost = await this.prisma.visibilityBoost.update({
      where: { id },
      data: { status },
    });

    // If boost becomes active, set start and end dates
    if (status === BoostStatus.ACTIVE) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + boost.durationDays);
      
      await this.prisma.visibilityBoost.update({
        where: { id: boost.id },
        data: {
          startDate,
          endDate,
        },
      });
    }

    return boost;
  }

  async handlePaymentCallback(boostId: string, paymentStatus: 'completed' | 'failed', transactionId: string) {
    const boost = await this.prisma.visibilityBoost.findUnique({ where: { id: boostId } });

    if (!boost) {
      throw new NotFoundException(`Visibility Boost with ID ${boostId} not found.`);
    }

    // Update payment record with final status
    await this.prisma.payment.updateMany({
      where: {
        transactionId: transactionId,
        boostId: boostId,
      },
      data: {
        status: paymentStatus,
      },
    });

    if (paymentStatus === 'completed') {
      return this.updateBoostStatus(boostId, BoostStatus.ACTIVE);
    } else if (paymentStatus === 'failed') {
      return this.updateBoostStatus(boostId, BoostStatus.CANCELLED);
    }
    // Handle other statuses as needed
  }

  async remove(id: string) {
    return this.prisma.visibilityBoost.delete({ where: { id } });
  }
}
