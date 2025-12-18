import { Controller, Post, Body, Param, Patch, Get, Put, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ServiceBookingService } from './service-booking.service';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { ConfirmServiceCompletionDto } from './dto/confirm-service-completion.dto';
import { UpdateServiceBookingDto } from './dto/update-service-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService

@Controller('service-bookings')
export class ServiceBookingController {
  constructor(
    private readonly serviceBookingService: ServiceBookingService,
    private readonly prisma: PrismaService, // Inject PrismaService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant')
  @Post()
  async create(@Body() createServiceBookingDto: CreateServiceBookingDto, @AuthUser() authUser: User) {
    // Ensure tenantId matches authenticated user's ID
    if (createServiceBookingDto.tenantId !== authUser.id) {
      throw new UnauthorizedException('You can only create bookings for yourself.');
    }
    return this.serviceBookingService.createServiceBooking(createServiceBookingDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'service_provider')
  @Get()
  async findAll(@AuthUser() authUser: User) {
    if (authUser.role.includes('admin')) {
      return this.serviceBookingService.findAll();
    } else if (authUser.role.includes('tenant')) {
      return this.serviceBookingService.findByTenantId(authUser.id);
    } else if (authUser.role.includes('service_provider')) {
      return this.serviceBookingService.findByProviderId(authUser.id);
    }
    throw new UnauthorizedException('You are not authorized to view service bookings.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'service_provider')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const booking = await this.serviceBookingService.findOne(id);
    if (!booking) {
      throw new NotFoundException('Service booking not found.');
    }

    if (authUser.role.includes('admin')) {
      return booking;
    }
    if (authUser.role.includes('tenant') && booking.tenantId === authUser.id) {
      return booking;
    }
    if (authUser.role.includes('service_provider')) {
      const service = await this.prisma.service.findUnique({ where: { id: booking.serviceId } });
      if (service && service.providerId === authUser.id) {
        return { ...booking, service: service }; // Return booking with service attached
      }
    }
    throw new UnauthorizedException('You are not authorized to view this service booking.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'service_provider')
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateServiceBookingDto: UpdateServiceBookingDto, @AuthUser() authUser: User) {
    const existingBooking = await this.serviceBookingService.findOne(id);
    if (!existingBooking) {
      throw new NotFoundException('Service booking not found.');
    }

    if (authUser.role.includes('admin')) {
      return this.serviceBookingService.update(id, updateServiceBookingDto);
    }
    // Allow service provider to update only specific fields (e.g., status) for their services
    if (authUser.role.includes('service_provider')) {
      const service = await this.prisma.service.findUnique({ where: { id: existingBooking.serviceId } });
      if (service && service.providerId === authUser.id) {
        // You might want to restrict which fields a service provider can update
        // For example, only status: updateServiceBookingDto = { status: updateServiceBookingDto.status }
        return this.serviceBookingService.update(id, updateServiceBookingDto);
      }
    }
    throw new UnauthorizedException('You are not authorized to update this service booking.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant', 'service_provider')
  @Patch(':id/confirm')
  async confirmCompletion(@Param('id') id: string, @Body() confirmServiceCompletionDto: ConfirmServiceCompletionDto, @AuthUser() authUser: User) {
    // Ensure the actorId in DTO matches the authenticated user's ID
    confirmServiceCompletionDto.actorId = authUser.id;
    // Set the role dynamically from the authenticated user
    confirmServiceCompletionDto.role = authUser.role.includes('tenant') ? 'tenant' : 'provider';

    return this.serviceBookingService.confirmServiceCompletion(id, confirmServiceCompletionDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'service_provider')
  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @AuthUser() authUser: User) {
    const booking = await this.serviceBookingService.findOne(id);
    if (!booking) {
      throw new NotFoundException('Service booking not found.');
    }

    // Admin can cancel any booking
    if (authUser.role.includes('admin')) {
      return this.serviceBookingService.cancel(id);
    }
    // Tenant can cancel their own booking
    if (authUser.role.includes('tenant') && booking.tenantId === authUser.id) {
      return this.serviceBookingService.cancel(id);
    }
    // Service provider can cancel booking for their service
    if (authUser.role.includes('service_provider')) {
      const service = await this.prisma.service.findUnique({ where: { id: booking.serviceId } });
      if (service && service.providerId === authUser.id) {
        return this.serviceBookingService.cancel(id);
      }
    }
    throw new UnauthorizedException('You are not authorized to cancel this service booking.');
  }
}

