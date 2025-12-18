import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord')
  @Post()
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto, @AuthUser() authUser: User) {
    // Ensure landlord can only create subscription for themselves
    if (createSubscriptionDto.userId !== authUser.id) {
      throw new UnauthorizedException('You can only create a subscription for your own account.');
    }
    return this.subscriptionService.create(createSubscriptionDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.subscriptionService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const subscription = await this.subscriptionService.findOne(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    if (authUser.role.includes('admin') || subscription.userId === authUser.id) {
      return subscription;
    }
    throw new UnauthorizedException('You are not authorized to view this subscription.');
  }

  // A specific endpoint to handle status updates, e.g., from a webhook
  // This endpoint should be protected by a shared secret or IP whitelist in a real application
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    // Validate status string against enum
    // For now, directly cast for example, but proper validation needed
    return this.subscriptionService.updateSubscriptionStatus(id, status as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(id);
  }

  @Post('/callback')
  async handlePaymentCallback(
    @Body('subscriptionId') subscriptionId: string,
    @Body('paymentStatus') paymentStatus: 'completed' | 'failed',
    @Body('transactionId') transactionId: string,
  ) {
    return this.subscriptionService.handlePaymentCallback(subscriptionId, paymentStatus, transactionId);
  }
}
