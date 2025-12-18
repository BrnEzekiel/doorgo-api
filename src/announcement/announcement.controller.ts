import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { User as AuthUser } from '../common/decorators/user.decorator'; // Import AuthUser decorator
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService

@UseGuards(JwtAuthGuard, RolesGuard) // Add RolesGuard at controller level
@Controller('announcements')
export class AnnouncementController {
  constructor(
    private readonly announcementService: AnnouncementService,
    private readonly prisma: PrismaService, // Inject PrismaService
  ) {}

  @Roles('admin', 'landlord', 'caretaker')
  @Post()
  async create(@Body() createAnnouncementDto: CreateAnnouncementDto, @AuthUser() authUser: User) {
    // Ensure the hostel owner/caretaker is creating announcement for their hostel
    const hostel = await this.prisma.hostel.findUnique({ where: { id: createAnnouncementDto.hostelId } });
    if (!hostel || (hostel.ownerId !== authUser.id && hostel.caretakerId !== authUser.id && !authUser.role.includes('admin'))) {
      throw new UnauthorizedException('You are not authorized to create announcements for this hostel.');
    }
    return this.announcementService.create(createAnnouncementDto);
  }

  @Get()
  findAll() {
    return this.announcementService.findAll();
  }

  @Get('hostel/:hostelId')
  findByHostel(@Param('hostelId') hostelId: string) {
    return this.announcementService.findByHostel(hostelId);
  }

  @Roles('admin', 'landlord', 'caretaker', 'tenant')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const announcement = await this.announcementService.findOne(id);
    if (!announcement) {
      throw new NotFoundException('Announcement not found.');
    }

    if (authUser.role.includes('admin')) {
      return announcement;
    }
    // Landlord can view announcements for their hostels
    if (authUser.role.includes('landlord') && announcement.hostel.ownerId === authUser.id) {
      return announcement;
    }
    // Caretaker can view announcements for their hostel
    if (authUser.role.includes('caretaker') && announcement.hostel.caretakerId === authUser.id) {
      return announcement;
    }
    // Tenant can view announcements for their hostel
    const userHostelBookings = await this.prisma.booking.findMany({
      where: { leadTenantId: authUser.id },
      select: { roomId: true },
    });
    const userHostelIds = (await Promise.all(userHostelBookings.map(b => this.prisma.room.findUnique({ where: { id: b.roomId }, select: { hostelId: true } }))))
      .filter(Boolean)
      .map(r => r.hostelId);

    if (authUser.role.includes('tenant') && userHostelIds.includes(announcement.hostelId)) {
      return announcement;
    }
    throw new UnauthorizedException('You are not authorized to view this announcement.');
  }

  @Roles('admin', 'landlord', 'caretaker')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAnnouncementDto: UpdateAnnouncementDto, @AuthUser() authUser: User) {
    const announcement = await this.announcementService.findOne(id);
    if (!announcement) {
      throw new NotFoundException('Announcement not found.');
    }
    if (authUser.role.includes('admin')) {
      return this.announcementService.update(id, updateAnnouncementDto);
    }
    if (authUser.role.includes('landlord') && announcement.hostel.ownerId === authUser.id) {
      return this.announcementService.update(id, updateAnnouncementDto);
    }
    if (authUser.role.includes('caretaker') && announcement.hostel.caretakerId === authUser.id) {
      return this.announcementService.update(id, updateAnnouncementDto);
    }
    throw new UnauthorizedException('You are not authorized to update this announcement.');
  }

  @Roles('admin', 'landlord', 'caretaker')
  @Delete(':id')
  async remove(@Param('id') id: string, @AuthUser() authUser: User) {
    const announcement = await this.announcementService.findOne(id);
    if (!announcement) {
      throw new NotFoundException('Announcement not found.');
    }
    if (authUser.role.includes('admin')) {
      return this.announcementService.remove(id);
    }
    if (authUser.role.includes('landlord') && announcement.hostel.ownerId === authUser.id) {
      return this.announcementService.remove(id);
    }
    if (authUser.role.includes('caretaker') && announcement.hostel.caretakerId === authUser.id) {
      return this.announcementService.remove(id);
    }
    throw new UnauthorizedException('You are not authorized to remove this announcement.');
  }
}
