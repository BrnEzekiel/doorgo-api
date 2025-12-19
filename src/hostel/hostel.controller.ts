import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UnauthorizedException } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager'; // Import CacheInterceptor and CacheTTL
import { HostelService } from './hostel.service';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { UpdateHostelDto } from './dto/update-hostel.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AssignCaretakerDto } from './dto/assign-caretaker.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { SubscriptionGuard } from '../common/guards/subscription.guard'; // Import SubscriptionGuard
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
@Controller('hostels')
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard) // Apply SubscriptionGuard
  @Roles('landlord')
  @Patch(':hostelId/assign-caretaker')
  assignCaretaker(
    @Param('hostelId') hostelId: string,
    @Body() assignCaretakerDto: AssignCaretakerDto,
    @AuthUser() user: User,
  ) {
    return this.hostelService.assignCaretaker(hostelId, assignCaretakerDto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord')
  @Post()
  createHostel(@Body() createHostelDto: CreateHostelDto, @AuthUser() user: User) {
    return this.hostelService.createHostel(createHostelDto, user.id);
  }

  @Get()
  @UseInterceptors(CacheInterceptor) // Cache this endpoint
  findAllHostels() {
    return this.hostelService.findAllHostels();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor) // Cache this endpoint
  @CacheTTL(60) // Cache for 60 seconds
  findOneHostel(@Param('id') id: string) {
    return this.hostelService.findOneHostel(id);
  }

  // New endpoint for landlord hostel control panel
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  @Roles('landlord')
  @Get(':id/control')
  findHostelControlDetails(
    @Param('id') id: string,
    @AuthUser() user: User,
  ) {
    return this.hostelService.findHostelControlDetails(id, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  @Roles('landlord')
  @Patch(':id')
  updateHostel(@Param('id') id: string, @Body() updateHostelDto: UpdateHostelDto) {
    return this.hostelService.updateHostel(id, updateHostelDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  @Roles('landlord')
  @Delete(':id')
  removeHostel(@Param('id') id: string) {
    return this.hostelService.removeHostel(id);
  }

  // Announcement endpoints
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  @Roles('landlord')
  @Post(':id/announcements')
  createAnnouncement(
    @Param('id') id: string,
    @Body() createAnnouncementDto: CreateAnnouncementDto,
  ) {
    return this.hostelService.createAnnouncement(id, createAnnouncementDto);
  }

  // Room endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord')
  @Post('rooms')
  createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.hostelService.createRoom(createRoomDto);
  }

  @Get('rooms')
  findAllRooms() {
    return this.hostelService.findAllRooms();
  }

  @Get('rooms/:id')
  findOneRoom(@Param('id') id: string) {
    return this.hostelService.findOneRoom(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  @Roles('landlord')
  @Patch('rooms/:id')
  updateRoom(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.hostelService.updateRoom(id, updateRoomDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  @Roles('landlord')
  @Delete('rooms/:id')
  removeRoom(@Param('id') id: string) {
    return this.hostelService.removeRoom(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  @Roles('admin', 'landlord')
  @Get(':id/occupancy')
  async getHostelOccupancy(@Param('id') id: string, @AuthUser() authUser: User) {
    // Admin can view any hostel's occupancy
    if (authUser.role.includes('admin')) {
      return this.hostelService.getOccupancyDetails(id);
    }

    // Landlord can only view occupancy for their own hostels
    const hostel = await this.hostelService.findOneHostel(id);
    if (!hostel || hostel.ownerId !== authUser.id) {
      throw new UnauthorizedException('You are not authorized to view occupancy for this hostel.');
    }
    return this.hostelService.getOccupancyDetails(id);
  }
}

