import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { LeaseService } from './lease.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { User as AuthUser } from '../common/decorators/user.decorator'; // Import AuthUser decorator
import { User } from '@prisma/client';
import { HostelService } from '../hostel/hostel.service'; // Import HostelService

@UseGuards(JwtAuthGuard, RolesGuard) // Add RolesGuard at controller level
@Controller('leases')
export class LeaseController {
  constructor(
    private readonly leaseService: LeaseService,
    private readonly hostelService: HostelService, // Inject HostelService
  ) {}

  @Roles('admin', 'landlord', 'caretaker')
  @Post()
  create(@Body() createLeaseDto: CreateLeaseDto) {
    return this.leaseService.create(createLeaseDto);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.leaseService.findAll();
  }

  @Roles('admin', 'landlord', 'tenant', 'caretaker')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const lease = await this.leaseService.findOne(id);
    if (!lease) {
      throw new NotFoundException('Lease not found.');
    }

    if (authUser.role.includes('admin')) {
      return lease;
    }
    // Landlord can view leases for their hostels
    if (authUser.role.includes('landlord') && lease.hostel.ownerId === authUser.id) {
      return lease;
    }
    // Caretaker can view leases for their hostel
    if (authUser.role.includes('caretaker') && lease.hostel.caretakerId === authUser.id) {
      return lease;
    }
    // Tenant can view their own lease
    if (authUser.role.includes('tenant') && lease.userId === authUser.id) {
      return lease;
    }
    throw new UnauthorizedException('You are not authorized to view this lease.');
  }

  @Roles('admin', 'landlord', 'tenant')
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string, @AuthUser() authUser: User) {
    if (authUser.role.includes('admin') || userId === authUser.id) {
      return this.leaseService.findByUser(userId);
    }
    // Landlord can view leases for tenants in their hostels
    if (authUser.role.includes('landlord')) {
      const hostels = await this.hostelService.findHostelsByOwner(authUser.id); // Assuming this method exists or create it
      const hostelIds = hostels.map(h => h.id);
      return this.leaseService.findByUserAndHostels(userId, hostelIds);
    }
    throw new UnauthorizedException('You are not authorized to view this user\'s leases.');
  }

  @Roles('admin', 'landlord', 'caretaker')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateLeaseDto: UpdateLeaseDto, @AuthUser() authUser: User) {
    const lease = await this.leaseService.findOne(id);
    if (!lease) {
      throw new NotFoundException('Lease not found.');
    }
    if (authUser.role.includes('admin')) {
      return this.leaseService.update(id, updateLeaseDto);
    }
    if (authUser.role.includes('landlord') && lease.hostel.ownerId === authUser.id) {
      return this.leaseService.update(id, updateLeaseDto);
    }
    if (authUser.role.includes('caretaker') && lease.hostel.caretakerId === authUser.id) {
      return this.leaseService.update(id, updateLeaseDto);
    }
    throw new UnauthorizedException('You are not authorized to update this lease.');
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaseService.remove(id);
  }
}
