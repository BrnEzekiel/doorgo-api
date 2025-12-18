import { Controller, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common'; // Added UseGuards
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Import JwtAuthGuard
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator

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

