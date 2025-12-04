import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { UpdateHostelDto } from './dto/update-hostel.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UserService } from '../user/user.service'; // Import UserService
import { AssignCaretakerDto } from './dto/assign-caretaker.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class HostelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async assignCaretaker(
    hostelId: string,
    assignCaretakerDto: AssignCaretakerDto,
    landlordId: string,
  ) {
    const { caretakerId } = assignCaretakerDto;

    // 1. Verify hostel exists and is owned by the landlord
    const hostel = await this.prisma.hostel.findUnique({ where: { id: hostelId } });
    if (!hostel) {
      throw new NotFoundException(`Hostel with ID ${hostelId} not found.`);
    }
    if (hostel.ownerId !== landlordId) {
      throw new UnauthorizedException('You are not the owner of this hostel.');
    }

    // 2. Verify caretaker user exists
    const caretaker = await this.userService.findOne(caretakerId);
    if (!caretaker) {
      throw new NotFoundException(`User with ID ${caretakerId} not found.`);
    }

    // 3. Update hostel with caretakerId
    const updatedHostel = await this.prisma.hostel.update({
      where: { id: hostelId },
      data: { caretakerId },
    });

    // 4. Update user role to include 'caretaker'
    const newRoles = [...new Set([...caretaker.role, UserRole.CARETAKER])]; // Avoid duplicate roles
    await this.userService.update(caretakerId, { role: newRoles });

    return updatedHostel;
  }

  // Hostel CRUD
  createHostel(createHostelDto: CreateHostelDto) {
    return this.prisma.hostel.create({ data: createHostelDto });
  }

  findAllHostels() {
    console.log('--- Executing findAllHostels in HostelService ---');
    return this.prisma.hostel.findMany({ include: { rooms: true } });
  }

  findOneHostel(id: string) {
    return this.prisma.hostel.findUnique({
      where: { id },
      include: { rooms: true, announcements: true, owner: true },
    });
  }

  updateHostel(id: string, updateHostelDto: UpdateHostelDto) {
    return this.prisma.hostel.update({
      where: { id },
      data: updateHostelDto,
    });
  }

  removeHostel(id: string) {
    return this.prisma.hostel.delete({ where: { id } });
  }

  // Announcement CRUD
  createAnnouncement(hostelId: string, createAnnouncementDto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        hostelId,
        ...createAnnouncementDto,
      },
    });
  }

  // Room CRUD
  createRoom(createRoomDto: CreateRoomDto) {
    return this.prisma.room.create({ data: createRoomDto });
  }

  findAllRooms() {
    return this.prisma.room.findMany();
  }

  findOneRoom(id: string) {
    return this.prisma.room.findUnique({ where: { id } });
  }

  updateRoom(id: string, updateRoomDto: UpdateRoomDto) {
    return this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });
  }

  removeRoom(id: string) {
    return this.prisma.room.delete({ where: { id } });
  }

  async findHostelControlDetails(hostelId: string, userId: string) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        owner: true, // Include owner to verify ownership if not already done by guard
        rooms: {
          include: {
            bookings: {
              where: { status: { not: 'CANCELED' } }, // Only active bookings
              include: {
                leadTenant: true, // Include tenant details
                payments: true,   // Include payment details if available
              },
            },
          },
        },
      },
    });

    if (!hostel) {
      throw new NotFoundException(`Hostel with ID ${hostelId} not found.`);
    }

    // Verify ownership
    if (hostel.ownerId !== userId) {
      throw new UnauthorizedException('You are not authorized to view this hostel\'s control panel.');
    }

    // Transform data to include derived properties like room occupancy and payment status
    const roomsWithDetails = hostel.rooms.map(room => {
      const currentOccupants = room.bookings ? room.bookings.length : 0;
      const isOccupied = currentOccupants > 0;
      const engagedOccupants = room.bookings?.filter(booking => booking.status === 'ACTIVE' || booking.status === 'PENDING').length || 0;
      const paidOccupants = room.bookings?.filter(booking => booking.payments?.some(payment => payment.status === 'PAID')).length || 0; // Assuming payment status

      return {
        ...room,
        currentOccupants,
        isOccupied,
        engagedOccupants, // Number of tenants with active/pending bookings
        paidOccupants, // Number of tenants who have made at least one payment
        tenants: room.bookings?.map(booking => ({
          id: booking.leadTenant.id,
          firstName: booking.leadTenant.firstName,
          lastName: booking.leadTenant.lastName,
          email: booking.leadTenant.email,
          bookingStatus: booking.status,
          payments: booking.payments,
          // Add other relevant tenant/booking details
        })),
      };
    });

    return {
      hostel: { ...hostel, rooms: undefined }, // Return hostel without nested rooms for cleaner structure
      rooms: roomsWithDetails,
      // Add other aggregated data here if needed for the control panel overview
    };
  }
}

