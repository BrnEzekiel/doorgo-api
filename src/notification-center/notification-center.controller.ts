import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { NotificationCenterService } from './notification-center.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('notifications-center')
@UseGuards(JwtAuthGuard)
export class NotificationCenterController {
  constructor(private readonly notificationCenterService: NotificationCenterService) {}

  @Get()
  async getNotifications(@AuthUser() user: User, @Query('read') read?: string) {
    const isRead = read === 'true' ? true : read === 'false' ? false : undefined;
    return this.notificationCenterService.getNotifications(user.id, isRead);
  }

  @Get('unread-count')
  async getUnreadCount(@AuthUser() user: User) {
    return this.notificationCenterService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  async markAsRead(@AuthUser() user: User, @Param('id') id: string) {
    await this.notificationCenterService.markAsRead(id, user.id);
    return { message: 'Notification marked as read.' };
  }

  @Patch('mark-all-read')
  async markAllAsRead(@AuthUser() user: User) {
    await this.notificationCenterService.markAllAsRead(user.id);
    return { message: 'All notifications marked as read.' };
  }
}
