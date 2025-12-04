import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RentStatusService } from './rent-status.service';
import { CreateRentStatusDto } from './dto/create-rent-status.dto';
import { UpdateRentStatusDto } from './dto/update-rent-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rent-status')
export class RentStatusController {
  constructor(private readonly rentStatusService: RentStatusService) {}

  @Post()
  create(@Body() createRentStatusDto: CreateRentStatusDto) {
    return this.rentStatusService.create(createRentStatusDto);
  }

  @Get()
  findAll() {
    return this.rentStatusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rentStatusService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.rentStatusService.findByUser(userId);
  }

  @Get('hostel/:hostelId')
  findByHostel(@Param('hostelId') hostelId: string) {
    return this.rentStatusService.findByHostel(hostelId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRentStatusDto: UpdateRentStatusDto) {
    return this.rentStatusService.update(id, updateRentStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rentStatusService.remove(id);
  }
}
