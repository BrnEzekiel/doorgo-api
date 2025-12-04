import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async requestWithdrawal(userId: string, requestWithdrawalDto: RequestWithdrawalDto) {
    const { amount, paymentMethod } = requestWithdrawalDto;
    const amountDecimal = new Decimal(amount); // Convert number to Decimal
    const COMMISSION_RATE = new Decimal(0.15); // 15% commission

    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const balance = new Decimal(user.balance || 0);

      if (balance.lessThan(amountDecimal)) {
        throw new BadRequestException('Insufficient balance for withdrawal.');
      }

      const commission = amountDecimal.times(COMMISSION_RATE);
      const netAmount = amountDecimal.minus(commission);

      if (netAmount.lessThanOrEqualTo(0)) {
        throw new BadRequestException('Withdrawal amount is too low after commission.');
      }

      // Update user's balance
      await prisma.user.update({
        where: { id: userId },
        data: { balance: balance.minus(amountDecimal) }, // Deduct the requested amount (including commission)
      });

      // Create withdrawal request record
      const withdrawal = await prisma.withdrawalRequest.create({
        data: {
          userId,
          amount: new Decimal(amount),
          commission,
          netAmount,
          paymentMethod: paymentMethod || user.phone || 'Unknown', // Use provided method or user's phone
          status: 'pending', // Pending approval/processing
        },
      });

      // In a real application, you would integrate with a payout service here (e.g., M-Pesa B2C)
      // For now, it's just recorded as pending.

      return { message: 'Withdrawal request submitted successfully.', withdrawal };
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}


