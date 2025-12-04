import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentPaymentDto } from './dto/create-rent-payment.dto';

@Injectable()
export class RentPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRentPaymentDto: CreateRentPaymentDto) {
    const { rentStatusId, amountPaid } = createRentPaymentDto;

    // Use a transaction to ensure both operations succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      // 1. Verify the rentStatus exists
      const rentStatus = await prisma.rentStatus.findUnique({
        where: { id: rentStatusId },
      });
      if (!rentStatus) {
        throw new NotFoundException(`RentStatus with ID ${rentStatusId} not found.`);
      }

      // 2. Create the RentPayment record
      const rentPayment = await prisma.rentPayment.create({
        data: createRentPaymentDto,
      });

      // 3. Update the RentStatus
      await prisma.rentStatus.update({
        where: { id: rentStatusId },
        data: {
          paymentStatus: 'Paid',
          lastPaymentDate: rentPayment.paymentDate,
        },
      });

      return rentPayment;
    });
  }
}
