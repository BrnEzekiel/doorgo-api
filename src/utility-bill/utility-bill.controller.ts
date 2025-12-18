import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UtilityBillService } from './utility-bill.service';
import { CreateUtilityBillDto } from './dto/create-utility-bill.dto';
import { UpdateUtilityBillDto } from './dto/update-utility-bill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { User as AuthUser } from '../common/decorators/user.decorator'; // Import AuthUser decorator
import { User } from '@prisma/client';
import { HostelService } from '../hostel/hostel.service'; // Import HostelService

@UseGuards(JwtAuthGuard, RolesGuard) // Add RolesGuard at controller level
@Controller('utility-bills')
export class UtilityBillController {
  constructor(
    private readonly utilityBillService: UtilityBillService,
    private readonly hostelService: HostelService, // Inject HostelService
  ) {}

  @Roles('admin', 'landlord', 'caretaker')
  @Post()
  create(@Body() createUtilityBillDto: CreateUtilityBillDto) {
    return this.utilityBillService.create(createUtilityBillDto);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.utilityBillService.findAll();
  }

  @Roles('admin', 'landlord', 'tenant', 'caretaker')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const utilityBill = await this.utilityBillService.findOne(id);
    if (!utilityBill) {
      throw new NotFoundException('Utility bill not found.');
    }

    if (authUser.role.includes('admin')) {
      return utilityBill;
    }
    // Landlord can view utility bills for their hostels
    if (authUser.role.includes('landlord') && utilityBill.hostel.ownerId === authUser.id) {
      return utilityBill;
    }
    // Caretaker can view utility bills for their hostel
    if (authUser.role.includes('caretaker') && utilityBill.hostel.caretakerId === authUser.id) {
      return utilityBill;
    }
    // Tenant can view their own utility bill
    if (authUser.role.includes('tenant') && utilityBill.userId === authUser.id) {
      return utilityBill;
    }
    throw new UnauthorizedException('You are not authorized to view this utility bill.');
  }

  @Roles('admin', 'landlord', 'tenant')
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string, @AuthUser() authUser: User) {
    if (authUser.role.includes('admin') || userId === authUser.id) {
      return this.utilityBillService.findByUser(userId);
    }
    // Landlord can view utility bills for tenants in their hostels
    if (authUser.role.includes('landlord')) {
      const hostels = await this.hostelService.findHostelsByOwner(authUser.id);
      const hostelIds = hostels.map(h => h.id);
      return this.utilityBillService.findByUserAndHostels(userId, hostelIds);
    }
    throw new UnauthorizedException('You are not authorized to view this user\'s utility bills.');
  }

  @Roles('admin', 'landlord', 'caretaker')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUtilityBillDto: UpdateUtilityBillDto, @AuthUser() authUser: User) {
    const utilityBill = await this.utilityBillService.findOne(id);
    if (!utilityBill) {
      throw new NotFoundException('Utility bill not found.');
    }
    if (authUser.role.includes('admin')) {
      return this.utilityBillService.update(id, updateUtilityBillDto);
    }
    if (authUser.role.includes('landlord') && utilityBill.hostel.ownerId === authUser.id) {
      return this.utilityBillService.update(id, updateUtilityBillDto);
    }
    if (authUser.role.includes('caretaker') && utilityBill.hostel.caretakerId === authUser.id) {
      return this.utilityBillService.update(id, updateUtilityBillDto);
    }
    throw new UnauthorizedException('You are not authorized to update this utility bill.');
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.utilityBillService.remove(id);
  }
}
