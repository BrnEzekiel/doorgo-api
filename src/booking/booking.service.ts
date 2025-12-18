import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { NotificationService } from '../notification/notification.service';
import { BookingStatus } from '@prisma/client';

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
        status: BookingStatus.PENDING,
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

    if (booking.leadTenant.phone) {
      await this.notificationService.sendWhatsAppNotification(
        booking.leadTenant.phone,
        `Your booking for room ${booking.room.roomNumber} in ${booking.room.hostelId} has been confirmed.`
      );
    }

    return booking;
  }

  findAll() {
    return this.prisma.booking.findMany({
      include: {
        tenants: true,
        leadTenant: true,
        room: {
          include: {
            hostel: true,
          },
        },
      },
    });
  }

  findByTenantId(tenantId: string) {
    return this.prisma.booking.findMany({
      where: { leadTenantId: tenantId },
      include: {
        tenants: true,
        leadTenant: true,
        room: {
          include: {
            hostel: true,
          },
        },
      },
    });
  }

  findByLandlordId(landlordId: string) {
    return this.prisma.booking.findMany({
      where: {
        room: {
          hostel: {
            ownerId: landlordId,
          },
        },
      },
      include: {
        tenants: true,
        leadTenant: true,
        room: {
          include: {
            hostel: true,
          },
        },
      },
    });
  }

  async findOne(id: string, user: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        tenants: true,
        leadTenant: true,
        room: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isTenantInBooking = booking.tenants.some(tenant => tenant.id === user.id);
    const isHostelOwner = booking.room.hostel.ownerId === user.id;

    if (!isTenantInBooking && !isHostelOwner) {
      throw new UnauthorizedException('You are not authorized to view this booking.');
    }

    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto, user: any) {
    const { status } = updateBookingDto;

    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.room.hostel.ownerId !== user.id) {
      throw new UnauthorizedException('You are not authorized to update this booking.');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: status as BookingStatus },
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
      data: { status: BookingStatus.CANCELLED },
    });

    // Update room occupancy
    await this.prisma.room.update({
      where: { id: booking.roomId },
      data: { currentOccupants: { decrement: booking.tenants.length } },
    });

    return { message: 'Booking cancelled successfully' };
  }

  async updateBookingRoomAssignment(bookingId: string, newRoomId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { tenants: true, room: true },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
      }

      const oldRoomId = booking.roomId;
      const numberOfTenants = booking.tenants.length;

      // Decrement occupants from old room
      await prisma.room.update({
        where: { id: oldRoomId },
        data: { currentOccupants: { decrement: numberOfTenants } },
      });

      // Increment occupants in new room
      await prisma.room.update({
        where: { id: newRoomId },
        data: { currentOccupants: { increment: numberOfTenants } },
      });

      // Update booking with new room ID
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { roomId: newRoomId },
      });

      return updatedBooking;
    });
  }

  async updateBookingTenants(bookingId: string, newTenantIds: string[]) {
    return this.prisma.$transaction(async (prisma) => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { tenants: true, room: true },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
      }

      // Calculate changes in occupants
      const oldNumberOfTenants = booking.tenants.length;
      const newNumberOfTenants = newTenantIds.length;
      const occupantDifference = newNumberOfTenants - oldNumberOfTenants;

      // Check new room capacity
      if (booking.room.currentOccupants + occupantDifference > booking.room.maxOccupants) {
        throw new BadRequestException('Updating tenants exceeds room capacity.');
      }

      // Update tenants in the booking
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          tenants: {
            set: newTenantIds.map(id => ({ id })), // Disconnect old and connect new
          },
        },
        include: { tenants: true, room: true },
      });

      // Update room occupancy
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { currentOccupants: { increment: occupantDifference } },
      });

      return updatedBooking;
    });
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

