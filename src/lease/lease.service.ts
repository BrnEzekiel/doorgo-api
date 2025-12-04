import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';

@Injectable()
export class LeaseService {
  constructor(private readonly prisma: PrismaService) {}

  create(createLeaseDto: CreateLeaseDto) {
    return this.prisma.lease.create({ data: createLeaseDto });
  }

  findAll() {
    return this.prisma.lease.findMany({
      include: { user: true, hostel: true },
    });
  }

  findOne(id: string) {
    return this.prisma.lease.findUnique({
      where: { id },
      include: { user: true, hostel: true },
    });
  }

  findByUser(userId: string) {
    return this.prisma.lease.findMany({
      where: { userId },
      include: { hostel: true },
    });
  }

  update(id: string, updateLeaseDto: UpdateLeaseDto) {
    return this.prisma.lease.update({
      where: { id },
      data: updateLeaseDto,
    });
  }

  remove(id: string) {
    return this.prisma.lease.delete({ where: { id } });
  }
}
