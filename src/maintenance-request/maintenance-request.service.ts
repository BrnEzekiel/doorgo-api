import { Injectable, NotFoundException } from '@nestjs/common';
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
      include: {
        user: true,
        hostel: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { changedByUser: true },
        },
        assignedProvider: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePictureUrl: true, bio: true },
        },
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.maintenanceRequest.findMany({
      where: { userId },
      include: {
        hostel: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { changedByUser: true },
        },
        assignedProvider: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePictureUrl: true, bio: true },
        },
      },
    });
  }

  findByUserAndHostels(userId: string, hostelIds: string[]) {
    return this.prisma.maintenanceRequest.findMany({
      where: {
        userId,
        hostelId: { in: hostelIds },
      },
      include: { hostel: true },
    });
  }

  findByHostel(hostelId: string) {
    return this.prisma.maintenanceRequest.findMany({
      where: { hostelId },
      include: { user: true },
    });
  }

  async update(id: string, updateMaintenanceRequestDto: UpdateMaintenanceRequestDto, changedByUserId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const existingRequest = await prisma.maintenanceRequest.findUnique({
        where: { id },
      });

      if (!existingRequest) {
        throw new NotFoundException(`Maintenance request with ID ${id} not found.`);
      }

      const updatedRequest = await prisma.maintenanceRequest.update({
        where: { id },
        data: updateMaintenanceRequestDto,
      });

      if (updateMaintenanceRequestDto.status && updateMaintenanceRequestDto.status !== existingRequest.status) {
        await prisma.maintenanceStatusHistory.create({
          data: {
            maintenanceRequestId: id,
            oldStatus: existingRequest.status,
            newStatus: updateMaintenanceRequestDto.status,
            changedByUserId,
          },
        });
      }

      return updatedRequest;
    });
  }

  remove(id: string) {
    return this.prisma.maintenanceRequest.delete({ where: { id } });
  }
}
