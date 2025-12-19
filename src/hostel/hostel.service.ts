import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { BookingStatus } from '@prisma/client';
import { AssignCaretakerDto } from './dto/assign-caretaker.dto';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { UpdateHostelDto } from './dto/update-hostel.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
// import { UserRole } from '../user/enums/user-role.enum'; // Removed as it doesn't exist

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
    const newRoles = [...new Set([...caretaker.role, 'caretaker'])]; // Avoid duplicate roles
    await this.userService.update(caretakerId, { role: newRoles });

    return updatedHostel;
  }

  // Hostel CRUD
  createHostel(createHostelDto: CreateHostelDto, ownerId: string) {
    // Destructure properties that are not part of the direct Hostel model creation
    const { images, amenities, utilityTypes, paymentMethods, extraChargesDescription, ...hostelCreationData } = createHostelDto;

    return this.prisma.hostel.create({
      data: {
        ...hostelCreationData,
        owner: {
          connect: { id: ownerId },
        },
        // Images, amenities, utilityTypes, paymentMethods, extraChargesDescription are handled elsewhere (e.g., room level)
      },
    });
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

  async getOccupancyDetails(hostelId: string) {
    const rooms = await this.prisma.room.findMany({
      where: { hostelId },
    });

    if (!rooms || rooms.length === 0) {
      return { totalCapacity: 0, currentOccupants: 0, occupancyRate: 0, details: [] };
    }

    const totalCapacity = rooms.reduce((acc, room) => acc + room.maxOccupants, 0);
    const totalOccupants = rooms.reduce((acc, room) => acc + room.currentOccupants, 0); // Assuming currentOccupants is updated elsewhere
    const occupancyRate = totalCapacity > 0 ? (totalOccupants / totalCapacity) * 100 : 0;

    return {
      totalCapacity,
      currentOccupants: totalOccupants,
      occupancyRate: parseFloat(occupancyRate.toFixed(2)),
      details: rooms.map(room => ({
        roomId: room.id,
        roomNumber: room.roomNumber,
        occupants: room.currentOccupants,
        capacity: room.maxOccupants,
      })),
    };
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
    const hostelData = await this.prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        owner: true, // Include owner to verify ownership if not already done by guard
        rooms: {
          include: {
            bookings: {
              where: { status: { not: BookingStatus.CANCELLED } }, // Only active bookings
              include: {
                leadTenant: true, // Include tenant details
                invoices: {       // Correctly nest payments under invoices
                  include: {
                    payments: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!hostelData) {
      throw new NotFoundException(`Hostel with ID ${hostelId} not found.`);
    }

    // Verify ownership
    if (hostelData.ownerId !== userId) {
      throw new UnauthorizedException('You are not authorized to view this hostel\'s control panel.');
    }

    const { rooms, ...hostel } = hostelData;

    // Transform data to include derived properties like room occupancy and payment status
    const roomsWithDetails = rooms.map(room => {
      const currentOccupants = room.bookings ? room.bookings.length : 0;
      const isOccupied = currentOccupants > 0;
      
      const tenants = room.bookings?.map((booking: { leadTenant: { id: string; firstName: string | null; lastName: string | null; email: string; }; invoices: any[]; status: string; }) => {
        const hasPaid = booking.invoices.some(invoice => invoice.payments.some(p => p.status === 'completed'));
        return {
          id: booking.leadTenant.id,
          firstName: booking.leadTenant.firstName,
          lastName: booking.leadTenant.lastName,
          email: booking.leadTenant.email,
          bookingStatus: booking.status,
          hasPaid,
        };
      });

      return {
        ...room,
        bookings: undefined, // Remove original bookings to avoid redundancy
        currentOccupants,
        isOccupied,
        tenants,
      };
    });

    return {
      hostel,
      rooms: roomsWithDetails,
    };
  }

  async findHostelsByOwner(ownerId: string) {
    return this.prisma.hostel.findMany({
      where: { ownerId },
      select: { id: true, name: true },
    });
  }
}

