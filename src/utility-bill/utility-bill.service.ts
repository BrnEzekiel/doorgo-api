import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUtilityBillDto } from './dto/create-utility-bill.dto';
import { UpdateUtilityBillDto } from './dto/update-utility-bill.dto';

@Injectable()
export class UtilityBillService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUtilityBillDto: CreateUtilityBillDto) {
    return this.prisma.utilityBill.create({ data: createUtilityBillDto });
  }

  findAll() {
    return this.prisma.utilityBill.findMany({
      include: { user: true, hostel: true },
    });
  }

  findOne(id: string) {
    return this.prisma.utilityBill.findUnique({
      where: { id },
      include: { user: true, hostel: true },
    });
  }

  findByUser(userId: string) {
    return this.prisma.utilityBill.findMany({
      where: { userId },
      include: { hostel: true },
    });
  }

  update(id: string, updateUtilityBillDto: UpdateUtilityBillDto) {
    return this.prisma.utilityBill.update({
      where: { id },
      data: updateUtilityBillDto,
    });
  }

  remove(id: string) {
    return this.prisma.utilityBill.delete({ where: { id } });
  }
}
