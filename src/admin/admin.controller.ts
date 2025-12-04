import { Controller, Get, Param, Patch, Delete, Body, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
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
}

