import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto) {
    const { tenantIds, leadTenantId, roomId, startDate, endDate, billingCycle } = createBookingDto;

    // Validate all tenants exist
    const tenants = await this.prisma.user.findMany({
      where: { id: { in: tenantIds } },
    });
    if (tenants.length !== tenantIds.length) {
      throw new NotFoundException('One or more tenants not found');
    }

    // Validate lead tenant exists
    const leadTenant = await this.prisma.user.findUnique({ where: { id: leadTenantId } });
    if (!leadTenant) {
      throw new NotFoundException('Lead tenant not found');
    }

    // Check room capacity
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.currentOccupants + tenantIds.length > room.maxOccupants) {
      throw new BadRequestException('Booking exceeds room capacity');
    }

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        tenants: { connect: tenantIds.map(id => ({ id })) },
        leadTenant: { connect: { id: leadTenantId } },
        room: { connect: { id: roomId } },
        startDate,
        endDate,
        billingCycle,
      },
      include: {
        room: true,
        leadTenant: true,
      },
    });

    // Update room occupancy
    await this.prisma.room.update({
      where: { id: roomId },
      data: { currentOccupants: { increment: tenantIds.length } },
    });

    await this.notificationService.sendWhatsAppNotification(
      booking.leadTenant.phone,
      `Your booking for room ${booking.room.roomNumber} in ${booking.room.hostelId} has been confirmed.`
    );

    return booking;
  }

  findAll() {
    return this.prisma.booking.findMany({
      include: {
        tenants: true,
        leadTenant: true,
        room: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        tenants: true,
        leadTenant: true,
        room: true,
      },
    });
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    const { status } = updateBookingDto;
    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }

  async cancelBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { tenants: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Update room occupancy
    await this.prisma.room.update({
      where: { id: booking.roomId },
      data: { currentOccupants: { decrement: booking.tenants.length } },
    });

    return { message: 'Booking cancelled successfully' };
  }

  async getHostelOccupancy(hostelId: string) {
    const rooms = await this.prisma.room.findMany({
      where: { hostelId },
    });

    if (!rooms || rooms.length === 0) {
      return { occupancyRate: 0, details: [] };
    }

    const totalCapacity = rooms.reduce((acc, room) => acc + room.maxOccupants, 0);
    const totalOccupants = rooms.reduce((acc, room) => acc + room.currentOccupants, 0);
    const occupancyRate = (totalOccupants / totalCapacity) * 100;

    return {
      occupancyRate,
      details: rooms.map(room => ({
        roomId: room.id,
        roomNumber: room.roomNumber,
        occupants: room.currentOccupants,
        capacity: room.maxOccupants,
      })),
    };
  }
}

