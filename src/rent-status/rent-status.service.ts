import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentStatusDto } from './dto/create-rent-status.dto';
import { UpdateRentStatusDto } from './dto/update-rent-status.dto';

@Injectable()
export class RentStatusService {
  constructor(private readonly prisma: PrismaService) {}

  create(createRentStatusDto: CreateRentStatusDto) {
    return this.prisma.rentStatus.create({ data: createRentStatusDto });
  }

  findAll() {
    return this.prisma.rentStatus.findMany({
      include: { user: true, hostel: true, payments: { select: { id: true, amountPaid: true, paymentDate: true, reference: true, receiptUrl: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.rentStatus.findUnique({
      where: { id },
      include: {
        user: true,
        hostel: {
          include: {
            owner: true,
            caretaker: true,
          },
        },
        payments: { select: { id: true, amountPaid: true, paymentDate: true, reference: true, receiptUrl: true } },
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.rentStatus.findMany({
      where: { userId },
      include: { hostel: true, payments: { select: { id: true, amountPaid: true, paymentDate: true, reference: true, receiptUrl: true } } },
    });
  }

  findByUserAndHostels(userId: string, hostelIds: string[]) {
    return this.prisma.rentStatus.findMany({
      where: {
        userId,
        hostelId: { in: hostelIds },
      },
      include: { hostel: true, payments: { select: { id: true, amountPaid: true, paymentDate: true, reference: true, receiptUrl: true } } },
    });
  }

  findByHostel(hostelId: string) {
    return this.prisma.rentStatus.findMany({
      where: { hostelId },
      include: { user: true, payments: { select: { id: true, amountPaid: true, paymentDate: true, reference: true, receiptUrl: true } } },
    });
  }

  update(id: string, updateRentStatusDto: UpdateRentStatusDto) {
    return this.prisma.rentStatus.update({
      where: { id },
      data: updateRentStatusDto,
    });
  }

  remove(id: string) {
    return this.prisma.rentStatus.delete({ where: { id } });
  }
}
