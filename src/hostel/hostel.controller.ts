import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
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

@Controller('hostels')
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':hostelId/assign-caretaker')
  assignCaretaker(
    @Param('hostelId') hostelId: string,
    @Body() assignCaretakerDto: AssignCaretakerDto,
    @AuthUser() user: User,
  ) {
    return this.hostelService.assignCaretaker(hostelId, assignCaretakerDto, user.id);
  }

  // Hostel endpoints
  @Post()
  createHostel(@Body() createHostelDto: CreateHostelDto) {
    return this.hostelService.createHostel(createHostelDto);
  }

  @Get()
  findAllHostels() {
    return this.hostelService.findAllHostels();
  }

  @Get(':id')
  findOneHostel(@Param('id') id: string) {
    return this.hostelService.findOneHostel(id);
  }

  // New endpoint for landlord hostel control panel
  @UseGuards(JwtAuthGuard)
  @Get(':id/control')
  findHostelControlDetails(
    @Param('id') id: string,
    @AuthUser() user: User,
  ) {
    return this.hostelService.findHostelControlDetails(id, user.id);
  }

  @Patch(':id')
  updateHostel(@Param('id') id: string, @Body() updateHostelDto: UpdateHostelDto) {
    return this.hostelService.updateHostel(id, updateHostelDto);
  }

  @Delete(':id')
  removeHostel(@Param('id') id: string) {
    return this.hostelService.removeHostel(id);
  }

  // Announcement endpoints
  @UseGuards(JwtAuthGuard)
  @Post(':id/announcements')
  createAnnouncement(
    @Param('id') id: string,
    @Body() createAnnouncementDto: CreateAnnouncementDto,
  ) {
    return this.hostelService.createAnnouncement(id, createAnnouncementDto);
  }

  // Room endpoints
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

  @Patch('rooms/:id')
  updateRoom(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.hostelService.updateRoom(id, updateRoomDto);
  }

  @Delete('rooms/:id')
  removeRoom(@Param('id') id: string) {
    return this.hostelService.removeRoom(id);
  }
}

