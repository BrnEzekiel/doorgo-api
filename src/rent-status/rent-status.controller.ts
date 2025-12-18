import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { RentStatusService } from './rent-status.service';
import { CreateRentStatusDto } from './dto/create-rent-status.dto';
import { UpdateRentStatusDto } from './dto/update-rent-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { User as AuthUser } from '../common/decorators/user.decorator'; // Import AuthUser decorator
import { User } from '@prisma/client';
import { HostelService } from '../hostel/hostel.service'; // Import HostelService

@UseGuards(JwtAuthGuard, RolesGuard) // Add RolesGuard at controller level
@Controller('rent-status')
export class RentStatusController {
  constructor(
    private readonly rentStatusService: RentStatusService,
    private readonly hostelService: HostelService, // Inject HostelService
  ) {}

  @Roles('admin', 'landlord', 'caretaker')
  @Post()
  create(@Body() createRentStatusDto: CreateRentStatusDto) {
    return this.rentStatusService.create(createRentStatusDto);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.rentStatusService.findAll();
  }

  @Roles('admin', 'landlord', 'tenant', 'caretaker')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const rentStatus = await this.rentStatusService.findOne(id);
    if (!rentStatus) {
      throw new NotFoundException('Rent status not found.');
    }

    if (authUser.role.includes('admin')) {
      return rentStatus;
    }
    // Landlord can view rent statuses for their hostels
    if (authUser.role.includes('landlord') && rentStatus.hostel.ownerId === authUser.id) {
      return rentStatus;
    }
    // Caretaker can view rent statuses for their hostel
    if (authUser.role.includes('caretaker') && rentStatus.hostel.caretakerId === authUser.id) {
      return rentStatus;
    }
    // Tenant can view their own rent status
    if (authUser.role.includes('tenant') && rentStatus.userId === authUser.id) {
      return rentStatus;
    }
    throw new UnauthorizedException('You are not authorized to view this rent status.');
  }

  @Roles('admin', 'landlord', 'tenant')
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string, @AuthUser() authUser: User) {
    if (authUser.role.includes('admin') || userId === authUser.id) {
      return this.rentStatusService.findByUser(userId);
    }
    // Landlord can view rent statuses for tenants in their hostels
    if (authUser.role.includes('landlord')) {
      const hostels = await this.hostelService.findHostelsByOwner(authUser.id);
      const hostelIds = hostels.map(h => h.id);
      return this.rentStatusService.findByUserAndHostels(userId, hostelIds);
    }
    throw new UnauthorizedException('You are not authorized to view this user\'s rent statuses.');
  }

  @Roles('admin', 'landlord', 'caretaker')
  @Get('hostel/:hostelId')
  async findByHostel(@Param('hostelId') hostelId: string, @AuthUser() authUser: User) {
    if (authUser.role.includes('admin')) {
      return this.rentStatusService.findByHostel(hostelId);
    }
    const hostel = await this.hostelService.findOneHostel(hostelId);
    if (!hostel) {
      throw new NotFoundException('Hostel not found.');
    }
    if (authUser.role.includes('landlord') && hostel.ownerId === authUser.id) {
      return this.rentStatusService.findByHostel(hostelId);
    }
    if (authUser.role.includes('caretaker') && hostel.caretakerId === authUser.id) {
      return this.rentStatusService.findByHostel(hostelId);
    }
    throw new UnauthorizedException('You are not authorized to view rent statuses for this hostel.');
  }

  @Roles('admin', 'landlord', 'caretaker')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRentStatusDto: UpdateRentStatusDto, @AuthUser() authUser: User) {
    const rentStatus = await this.rentStatusService.findOne(id);
    if (!rentStatus) {
      throw new NotFoundException('Rent status not found.');
    }
    if (authUser.role.includes('admin')) {
      return this.rentStatusService.update(id, updateRentStatusDto);
    }
    if (authUser.role.includes('landlord') && rentStatus.hostel.ownerId === authUser.id) {
      return this.rentStatusService.update(id, updateRentStatusDto);
    }
    if (authUser.role.includes('caretaker') && rentStatus.hostel.caretakerId === authUser.id) {
      return this.rentStatusService.update(id, updateRentStatusDto);
    }
    throw new UnauthorizedException('You are not authorized to update this rent status.');
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rentStatusService.remove(id);
  }
}
