import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WithdrawalRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWithdrawalRequestDto: CreateWithdrawalRequestDto, user: User) {
    const { amount, paymentMethod } = createWithdrawalRequestDto;
    const amountDecimal = new Decimal(amount);

    return this.prisma.$transaction(async (prisma) => {
      const serviceProvider = await prisma.user.findUnique({ where: { id: user.id } });

      if (!serviceProvider) {
        throw new NotFoundException('Service provider not found.');
      }

      if (serviceProvider.balance.lessThan(amountDecimal)) {
        throw new BadRequestException('Insufficient balance for withdrawal.');
      }

      const commission = new Decimal(0); // No withdrawal commission
      const netAmount = amountDecimal;

      await prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amountDecimal } },
      });

      const withdrawalRequest = await prisma.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: amountDecimal,
          commission,
          netAmount,
          paymentMethod,
          status: 'pending',
        },
      });

      return withdrawalRequest;
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
