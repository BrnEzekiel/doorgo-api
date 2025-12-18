import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord', 'caretaker')
  @Post()
  create(@Body() createChecklistDto: CreateChecklistDto) {
    return this.checklistService.createChecklist(createChecklistDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord', 'caretaker')
  @Get()
  findAll() {
    return this.checklistService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord', 'caretaker', 'tenant')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const checklist = await this.checklistService.findOne(id);
    if (!checklist) {
      throw new NotFoundException('Checklist not found.');
    }

    if (authUser.role.includes('admin')) {
      return checklist;
    }
    // Landlord can view checklists for their hostels
    if (authUser.role.includes('landlord') && checklist.booking.room.hostel.ownerId === authUser.id) {
      return checklist;
    }
    // Caretaker can view checklists for their hostel
    if (authUser.role.includes('caretaker') && checklist.booking.room.hostel.caretakerId === authUser.id) {
      return checklist;
    }
    // Tenant can view their own checklist
    if (authUser.role.includes('tenant') && checklist.booking.leadTenantId === authUser.id) {
      return checklist;
    }
    throw new UnauthorizedException('You are not authorized to view this checklist.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord', 'caretaker')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
    @AuthUser() authUser: User,
  ) {
    const checklist = await this.checklistService.findOne(id);
    if (!checklist) {
      throw new NotFoundException('Checklist not found.');
    }
    if (authUser.role.includes('admin')) {
      return this.checklistService.update(id, updateChecklistDto);
    }
    if (authUser.role.includes('landlord') && checklist.booking.room.hostel.ownerId === authUser.id) {
      return this.checklistService.update(id, updateChecklistDto);
    }
    if (authUser.role.includes('caretaker') && checklist.booking.room.hostel.caretakerId === authUser.id) {
      return this.checklistService.update(id, updateChecklistDto);
    }
    throw new UnauthorizedException('You are not authorized to update this checklist.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistService.remove(id);
  }
}

