import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSmsBundleDto } from './dto/create-sms-bundle.dto';
import { PaymentService } from '../payment/payment.service';
import { SmsBundleStatus } from '@prisma/client';

@Injectable()
export class SmsBundleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async create(createSmsBundleDto: CreateSmsBundleDto) {
    const { userId, bundleName, smsCount, price } = createSmsBundleDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const newSmsBundle = await this.prisma.smsBundle.create({
      data: {
        userId,
        bundleName,
        smsCount,
        price,
        status: SmsBundleStatus.PENDING_PAYMENT,
        purchaseDate: new Date(),
        // expiryDate: new Date(), // Will be set after payment
      },
    });

    const paymentInitiation = await this.paymentService.initiatePayment({
      smsBundleId: newSmsBundle.id,
      amount: price,
      phone: user.phone, // Assuming user.phone is available for payment
    });

    // Update the SMS bundle with the payment transaction ID
    const updatedSmsBundle = await this.prisma.smsBundle.update({
      where: { id: newSmsBundle.id },
      data: {
        transactionId: paymentInitiation.transactionId,
      },
    });

    return {
      smsBundle: updatedSmsBundle,
      paymentInitiationDetails: paymentInitiation,
    };
  }

  async findAll() {
    return this.prisma.smsBundle.findMany({
      include: { user: true },
    });
  }

  async findOne(id: string) {
    const smsBundle = await this.prisma.smsBundle.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!smsBundle) {
      throw new NotFoundException(`SMS Bundle with ID ${id} not found.`);
    }
    return smsBundle;
  }

  async updateSmsBundleStatus(id: string, status: SmsBundleStatus) {
    const smsBundle = await this.prisma.smsBundle.update({
      where: { id },
      data: { status },
    });

    // If bundle becomes active, update expiry date
    if (status === SmsBundleStatus.ACTIVE) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month validity
      
      await this.prisma.smsBundle.update({
        where: { id: smsBundle.id },
        data: {
          expiryDate,
        },
      });
    }

    return smsBundle;
  }

  async handlePaymentCallback(smsBundleId: string, paymentStatus: 'completed' | 'failed', transactionId: string) {
    const smsBundle = await this.prisma.smsBundle.findUnique({ where: { id: smsBundleId } });

    if (!smsBundle) {
      throw new NotFoundException(`SMS Bundle with ID ${smsBundleId} not found.`);
    }

    // Update payment record with final status
    await this.prisma.payment.updateMany({
      where: {
        transactionId: transactionId,
        smsBundleId: smsBundleId,
      },
      data: {
        status: paymentStatus,
      },
    });

    if (paymentStatus === 'completed') {
      return this.updateSmsBundleStatus(smsBundleId, SmsBundleStatus.ACTIVE);
    } else if (paymentStatus === 'failed') {
      return this.updateSmsBundleStatus(smsBundleId, SmsBundleStatus.CANCELLED);
    }
    // Handle other statuses as needed
  }

  async remove(id: string) {
    return this.prisma.smsBundle.delete({ where: { id } });
  }
}
