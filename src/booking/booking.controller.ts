import { Controller, Post, Body, Param, Patch, Get, Put, UseGuards, UnauthorizedException } from '@nestjs/common'; // Added UnauthorizedException
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateBookingRoomDto } from './dto/update-booking-room.dto'; // Import UpdateBookingRoomDto
import { UpdateBookingTenantsDto } from './dto/update-booking-tenants.dto'; // Import UpdateBookingTenantsDto
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { User } from '@prisma/client';
import { HostelService } from '../hostel/hostel.service'; // Import HostelService

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly hostelService: HostelService, // Inject HostelService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant')
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @AuthUser() authUser: User) {
    // Ensure leadTenantId matches authenticated user's ID
    if (createBookingDto.leadTenantId !== authUser.id) {
      throw new UnauthorizedException('You can only create bookings for yourself.');
    }
    return this.bookingService.createBooking(createBookingDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'landlord')
  @Get()
  async findAll(@AuthUser() authUser: User) {
    if (authUser.role.includes('admin')) {
      return this.bookingService.findAll();
    } else if (authUser.role.includes('tenant')) {
      return this.bookingService.findByTenantId(authUser.id);
    } else if (authUser.role.includes('landlord')) {
      return this.bookingService.findByLandlordId(authUser.id);
    }
    throw new UnauthorizedException('You are not authorized to view bookings.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'landlord')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const booking = await this.bookingService.findOne(id, authUser); // Pass authUser for internal checks
    // The service layer already contains authorization checks based on user roles and ownership.
    // If it returns a booking, it means the authUser is authorized.
    return booking;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord')
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto, @AuthUser() authUser: User) {
    return this.bookingService.update(id, updateBookingDto, authUser);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'landlord')
  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @AuthUser() authUser: User) {
    await this.bookingService.findOne(id, authUser); // findOne has auth checks
    return this.bookingService.cancelBooking(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord')
  @Patch(':id/room')
  async updateBookingRoom(
    @Param('id') id: string,
    @Body() updateBookingRoomDto: UpdateBookingRoomDto,
    @AuthUser() authUser: User,
  ) {
    await this.bookingService.findOne(id, authUser); // findOne has auth checks for landlord/admin
    // Additional authorization checks in service layer
    return this.bookingService.updateBookingRoomAssignment(id, updateBookingRoomDto.newRoomId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord')
  @Get('hostel/:hostelId/occupancy')
  async getHostelOccupancy(@Param('hostelId') hostelId: string, @AuthUser() authUser: User) {
    // Admin can view any hostel's occupancy
    if (authUser.role.includes('admin')) {
      return this.bookingService.getHostelOccupancy(hostelId);
    }

    // Landlord can only view occupancy for their own hostels
    const hostel = await this.hostelService.findOneHostel(hostelId);
    if (!hostel || hostel.ownerId !== authUser.id) {
      throw new UnauthorizedException('You are not authorized to view occupancy for this hostel.');
    }
    return this.bookingService.getHostelOccupancy(hostelId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord')
  @Patch(':id/tenants')
  async updateBookingTenants(
    @Param('id') id: string,
    @Body() updateBookingTenantsDto: UpdateBookingTenantsDto,
    @AuthUser() authUser: User,
  ) {
    await this.bookingService.findOne(id, authUser); // findOne has auth checks for landlord/admin
    // Additional authorization checks in service layer
    return this.bookingService.updateBookingTenants(id, updateBookingTenantsDto.newTenantIds);
  }
}

