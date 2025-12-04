import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceRequestDto } from './dto/update-maintenance-request.dto';

@Injectable()
export class MaintenanceRequestService {
  constructor(private readonly prisma: PrismaService) {}

  create(createMaintenanceRequestDto: CreateMaintenanceRequestDto) {
    return this.prisma.maintenanceRequest.create({ data: createMaintenanceRequestDto });
  }

  findAll() {
    return this.prisma.maintenanceRequest.findMany({
      include: { user: true, hostel: true },
    });
  }

  findOne(id: string) {
    return this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { user: true, hostel: true },
    });
  }

  findByUser(userId: string) {
    return this.prisma.maintenanceRequest.findMany({
      where: { userId },
      include: { hostel: true },
    });
  }

  findByHostel(hostelId: string) {
    return this.prisma.maintenanceRequest.findMany({
      where: { hostelId },
      include: { user: true },
    });
  }

  update(id: string, updateMaintenanceRequestDto: UpdateMaintenanceRequestDto) {
    return this.prisma.maintenanceRequest.update({
      where: { id },
      data: updateMaintenanceRequestDto,
    });
  }

  remove(id: string) {
    return this.prisma.maintenanceRequest.delete({ where: { id } });
  }
}
