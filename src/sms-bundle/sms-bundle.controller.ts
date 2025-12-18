import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SmsBundleService } from './sms-bundle.service';
import { CreateSmsBundleDto } from './dto/create-sms-bundle.dto';
import { UpdateSmsBundleDto } from './dto/update-sms-bundle.dto';
import { SmsBundleStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('sms-bundles')
export class SmsBundleController {
  constructor(private readonly smsBundleService: SmsBundleService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'landlord', 'service_provider', 'caretaker')
  @Post()
  async create(@Body() createSmsBundleDto: CreateSmsBundleDto, @AuthUser() authUser: User) {
    // Ensure user can only create bundle for themselves
    if (createSmsBundleDto.userId !== authUser.id) {
      throw new UnauthorizedException('You can only create an SMS bundle for your own account.');
    }
    return this.smsBundleService.create(createSmsBundleDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.smsBundleService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'landlord', 'service_provider', 'caretaker')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const smsBundle = await this.smsBundleService.findOne(id);
    if (!smsBundle) {
      throw new NotFoundException('SMS Bundle not found.');
    }

    if (authUser.role.includes('admin') || smsBundle.userId === authUser.id) {
      return smsBundle;
    }
    throw new UnauthorizedException('You are not authorized to view this SMS bundle.');
  }

  // A specific endpoint to handle status updates, e.g., from a webhook
  // This endpoint should be protected by a shared secret or IP whitelist in a real application
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: SmsBundleStatus) {
    return this.smsBundleService.updateSmsBundleStatus(id, status);
  }

  @Post('/callback')
  async handlePaymentCallback(
    @Body('smsBundleId') smsBundleId: string,
    @Body('paymentStatus') paymentStatus: 'completed' | 'failed',
    @Body('transactionId') transactionId: string,
  ) {
    return this.smsBundleService.handlePaymentCallback(smsBundleId, paymentStatus, transactionId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.smsBundleService.remove(id);
  }
}
