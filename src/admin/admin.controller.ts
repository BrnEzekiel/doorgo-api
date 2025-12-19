import { Controller, Get, Param, Patch, Delete, UseGuards, Post, Body } from '@nestjs/common'; // Added Post, Body
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Import JwtAuthGuard
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { CreateUserDto } from '../user/dto/create-user.dto'; // Import CreateUserDto
import { UpdateUserDto } from '../user/dto/update-user.dto'; // Import UpdateUserDto

@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards at controller level
@Roles('admin') // Require 'admin' role for all endpoints in this controller
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('users')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  // Moderation Endpoints
  @Patch('hostels/:id/approve')
  approveHostel(@Param('id') id: string) {
    return this.adminService.approveHostel(id);
  }

  @Patch('hostels/:id/reject')
  rejectHostel(@Param('id') id: string) {
    return this.adminService.rejectHostel(id);
  }

  @Patch('users/:id/approve')
  approveUser(@Param('id') id: string) {
    return this.adminService.approveUser(id);
  }

  @Patch('users/:id/reject')
  rejectUser(@Param('id') id: string) {
    return this.adminService.rejectUser(id);
  }

  @Delete('hostels/:id')
  removeHostel(@Param('id') id: string) {
    return this.adminService.removeHostel(id);
  }

  @Delete('users/:id')
  removeUser(@Param('id') id: string) {
    return this.adminService.removeUser(id);
  }

  @Delete('services/:id')
  removeService(@Param('id') id: string) {
    return this.adminService.removeService(id);
  }

  @Patch('services/:id/approve')
  approveService(@Param('id') id: string) {
    return this.adminService.approveService(id);
  }

  @Patch('services/:id/reject')
  rejectService(@Param('id') id: string) {
    return this.adminService.rejectService(id);
  }

  // Fraud Detection Endpoints
  @Get('fraud/suspicious-registrations')
  detectSuspiciousRegistrations() {
    return this.adminService.detectSuspiciousRegistrations();
  }

  @Get('fraud/suspicious-cancellations')
  detectSuspiciousCancellations() {
    return this.adminService.detectSuspiciousCancellations();
  }

  @Get('booking-trends')
  getBookingTrends() {
    return this.adminService.getBookingTrends();
  }
}

