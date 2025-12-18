import { Controller, Get, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { User as AuthUser } from '../common/decorators/user.decorator'; // Import AuthUser decorator
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService

@UseGuards(JwtAuthGuard, RolesGuard) // Add RolesGuard at controller level
@Controller('activity')
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService, // Inject PrismaService
  ) {}

  @Roles('admin', 'landlord', 'tenant')
  @Get('user/:userId')
  async getRecentActivity(@Param('userId') userId: string, @AuthUser() authUser: User) {
    if (authUser.role.includes('admin') || authUser.id === userId) {
      return this.activityService.getRecentActivity(userId);
    }
    if (authUser.role.includes('landlord')) {
      // Check if the user whose activity is being requested is in one of the landlord's hostels
      const userHostels = await this.prisma.hostel.findMany({
        where: { ownerId: authUser.id },
        select: { id: true },
      });
      const userHostelIds = userHostels.map(h => h.id);

      const requestedUserHostelBooking = await this.prisma.booking.findFirst({
        where: { leadTenantId: userId, room: { hostelId: { in: userHostelIds } } },
      });

      if (requestedUserHostelBooking) {
        return this.activityService.getRecentActivity(userId);
      }
    }
    throw new UnauthorizedException('You are not authorized to view this user\'s activity.');
  }
}