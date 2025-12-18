import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { MaintenanceRequestService } from './maintenance-request.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceRequestDto } from './dto/update-maintenance-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { User as AuthUser } from '../common/decorators/user.decorator'; // Import AuthUser decorator
import { User } from '@prisma/client';
import { HostelService } from '../hostel/hostel.service'; // Import HostelService

@UseGuards(JwtAuthGuard, RolesGuard) // Add RolesGuard at controller level
@Controller('maintenance-requests')
export class MaintenanceRequestController {
  constructor(
    private readonly maintenanceRequestService: MaintenanceRequestService,
    private readonly hostelService: HostelService, // Inject HostelService
  ) {}

  @Roles('tenant', 'admin', 'landlord', 'caretaker')
  @Post()
  async create(@Body() createMaintenanceRequestDto: CreateMaintenanceRequestDto, @AuthUser() authUser: User) {
    if (createMaintenanceRequestDto.userId !== authUser.id && !authUser.role.includes('admin')) {
      throw new UnauthorizedException('You can only create maintenance requests for yourself, unless you are an admin.');
    }
    return this.maintenanceRequestService.create(createMaintenanceRequestDto);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.maintenanceRequestService.findAll();
  }

  @Roles('admin', 'landlord', 'tenant', 'caretaker')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const maintenanceRequest = await this.maintenanceRequestService.findOne(id);
    if (!maintenanceRequest) {
      throw new NotFoundException('Maintenance request not found.');
    }

    if (authUser.role.includes('admin')) {
      return maintenanceRequest;
    }
    // Landlord can view requests for their hostels
    if (authUser.role.includes('landlord') && maintenanceRequest.hostel.ownerId === authUser.id) {
      return maintenanceRequest;
    }
    // Caretaker can view requests for their hostel
    if (authUser.role.includes('caretaker') && maintenanceRequest.hostel.caretakerId === authUser.id) {
      return maintenanceRequest;
    }
    // Tenant can view their own request
    if (authUser.role.includes('tenant') && maintenanceRequest.userId === authUser.id) {
      return maintenanceRequest;
    }
    throw new UnauthorizedException('You are not authorized to view this maintenance request.');
  }

  @Roles('admin', 'landlord', 'tenant')
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string, @AuthUser() authUser: User) {
    if (authUser.role.includes('admin') || userId === authUser.id) {
      return this.maintenanceRequestService.findByUser(userId);
    }
    // Landlord can view maintenance requests for tenants in their hostels
    if (authUser.role.includes('landlord')) {
      const hostels = await this.hostelService.findHostelsByOwner(authUser.id);
      const hostelIds = hostels.map(h => h.id);
      return this.maintenanceRequestService.findByUserAndHostels(userId, hostelIds);
    }
    throw new UnauthorizedException('You are not authorized to view this user\'s maintenance requests.');
  }

  @Roles('admin', 'landlord', 'caretaker')
  @Get('hostel/:hostelId')
  async findByHostel(@Param('hostelId') hostelId: string, @AuthUser() authUser: User) {
    if (authUser.role.includes('admin')) {
      return this.maintenanceRequestService.findByHostel(hostelId);
    }
    const hostel = await this.hostelService.findOneHostel(hostelId);
    if (!hostel) {
      throw new NotFoundException('Hostel not found.');
    }
    if (authUser.role.includes('landlord') && hostel.ownerId === authUser.id) {
      return this.maintenanceRequestService.findByHostel(hostelId);
    }
    if (authUser.role.includes('caretaker') && hostel.caretakerId === authUser.id) {
      return this.maintenanceRequestService.findByHostel(hostelId);
    }
    throw new UnauthorizedException('You are not authorized to view maintenance requests for this hostel.');
  }

  @Roles('admin', 'landlord', 'caretaker', 'service_provider')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateMaintenanceRequestDto: UpdateMaintenanceRequestDto, @AuthUser() authUser: User) {
    const maintenanceRequest = await this.maintenanceRequestService.findOne(id);
    if (!maintenanceRequest) {
      throw new NotFoundException('Maintenance request not found.');
    }
    if (authUser.role.includes('admin')) {
      return this.maintenanceRequestService.update(id, updateMaintenanceRequestDto, authUser.id);
    }
    // Landlord can update requests for their hostels
    if (authUser.role.includes('landlord') && maintenanceRequest.hostel.ownerId === authUser.id) {
      return this.maintenanceRequestService.update(id, updateMaintenanceRequestDto, authUser.id);
    }
    // Caretaker can update requests for their hostel
    if (authUser.role.includes('caretaker') && maintenanceRequest.hostel.caretakerId === authUser.id) {
      return this.maintenanceRequestService.update(id, updateMaintenanceRequestDto, authUser.id);
    }
    // Service provider can update if assigned to the request
    if (authUser.role.includes('service_provider') && maintenanceRequest.assignedProviderId === authUser.id) {
        return this.maintenanceRequestService.update(id, updateMaintenanceRequestDto, authUser.id);
    }
    throw new UnauthorizedException('You are not authorized to update this maintenance request.');
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maintenanceRequestService.remove(id);
  }
}
