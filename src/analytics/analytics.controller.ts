import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('landlord/premium')
  getLandlordPremiumAnalytics(@AuthUser() user: User) {
    // Only landlords with active subscriptions can access this
    return this.analyticsService.getLandlordPremiumAnalytics(user.id);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Post('landlord/income-report')
  async getIncomeReport(
    @AuthUser() user: User,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.analyticsService.getIncomeReport(user.id, start, end);
  }
}
