import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentService } from '../payment/payment.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const { userId, tier, price, paymentMethod } = createSubscriptionDto;

    // In a real application, you'd initiate payment here and wait for callback
    // For now, we'll create a pending subscription and assume a payment initiation
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Example payment initiation (placeholder)
    // const paymentResponse = await this.paymentService.initiatePayment({
    //   userId: userId,
    //   amount: price,
    //   phone: user.phone,
    //   description: `${tier} subscription`,
    // });

    const newSubscription = await this.prisma.subscription.create({
      data: {
        userId,
        tier,
        price,
        status: 'PENDING' as SubscriptionStatus, // Will be updated to ACTIVE upon successful payment
        startDate: new Date(), // Placeholder, actual start date after payment
        endDate: new Date(),   // Placeholder, actual end date after payment
        paymentMethod,
      },
    });

    const paymentInitiation = await this.paymentService.initiatePayment({
      subscriptionId: newSubscription.id,
      amount: price,
      phone: user.phone, // Assuming user.phone is available for payment
    });

    // Update the subscription with the payment transaction ID
    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: newSubscription.id },
      data: {
        transactionId: paymentInitiation.transactionId,
      },
    });

    return {
      subscription: updatedSubscription,
      paymentInitiationDetails: paymentInitiation, // Return payment details to frontend
    };
  }

  async handlePaymentCallback(subscriptionId: string, paymentStatus: 'completed' | 'failed', transactionId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found.`);
    }

    // Update payment record with final status
    await this.prisma.payment.updateMany({
      where: {
        transactionId: transactionId,
        subscriptionId: subscriptionId,
      },
      data: {
        status: paymentStatus,
      },
    });

    if (paymentStatus === 'completed') {
      return this.updateSubscriptionStatus(subscriptionId, SubscriptionStatus.ACTIVE);
    } else if (paymentStatus === 'failed') {
      // Potentially handle retries or set to cancelled
      return this.updateSubscriptionStatus(subscriptionId, SubscriptionStatus.CANCELLED);
    }
    // Handle other statuses as needed
  }

  async findAll() {
    return this.prisma.subscription.findMany({
      include: { user: true },
    });
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found.`);
    }
    return subscription;
  }

  async updateSubscriptionStatus(id: string, status: SubscriptionStatus) {
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: { status },
    });

    // If subscription becomes active, update user's subscription details
    if (status === SubscriptionStatus.ACTIVE) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + 1); // 1 month subscription
      
      await this.prisma.user.update({
        where: { id: subscription.userId },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          subscriptionTier: subscription.tier,
        },
      });
    } else if (status === SubscriptionStatus.EXPIRED || status === SubscriptionStatus.CANCELLED) {
       await this.prisma.user.update({
        where: { id: subscription.userId },
        data: {
          subscriptionStatus: status, // Set user status to EXPIRED or CANCELLED
        },
      });
    }

    return subscription;
  }

  async remove(id: string) {
    return this.prisma.subscription.delete({ where: { id } });
  }
}