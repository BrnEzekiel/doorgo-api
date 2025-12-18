import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { VisibilityBoostService } from './visibility-boost.service';
import { CreateVisibilityBoostDto } from './dto/create-visibility-boost.dto';
import { UpdateVisibilityBoostDto } from './dto/update-visibility-boost.dto';
import { BoostStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('visibility-boosts')
export class VisibilityBoostController {
  constructor(private readonly visibilityBoostService: VisibilityBoostService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('service_provider')
  @Post()
  async create(@Body() createVisibilityBoostDto: CreateVisibilityBoostDto, @AuthUser() authUser: User) {
    // Ensure service provider can only create boost for their own services
    if (createVisibilityBoostDto.providerId !== authUser.id) {
      throw new UnauthorizedException('You can only create boosts for your own services.');
    }
    return this.visibilityBoostService.create(createVisibilityBoostDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.visibilityBoostService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'service_provider')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const boost = await this.visibilityBoostService.findOne(id);
    if (!boost) {
      throw new NotFoundException('Visibility Boost not found.');
    }

    if (authUser.role.includes('admin') || boost.providerId === authUser.id) {
      return boost;
    }
    throw new UnauthorizedException('You are not authorized to view this visibility boost.');
  }

  // A specific endpoint to handle status updates, e.g., from a webhook
  // This endpoint should be protected by a shared secret or IP whitelist in a real application
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: BoostStatus) {
    return this.visibilityBoostService.updateBoostStatus(id, status);
  }

  @Post('/callback')
  async handlePaymentCallback(
    @Body('boostId') boostId: string,
    @Body('paymentStatus') paymentStatus: 'completed' | 'failed',
    @Body('transactionId') transactionId: string,
  ) {
    return this.visibilityBoostService.handlePaymentCallback(boostId, paymentStatus, transactionId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visibilityBoostService.remove(id);
  }
}
