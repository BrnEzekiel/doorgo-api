import { Controller, Post, Body, Param, Patch, Get, Put } from '@nestjs/common';
import { ServiceBookingService } from './service-booking.service';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { ConfirmServiceCompletionDto } from './dto/confirm-service-completion.dto';
import { UpdateServiceBookingDto } from './dto/update-service-booking.dto';

@Controller('service-bookings')
export class ServiceBookingController {
  constructor(private readonly serviceBookingService: ServiceBookingService) {}

  @Post()
  create(@Body() createServiceBookingDto: CreateServiceBookingDto) {
    return this.serviceBookingService.createServiceBooking(createServiceBookingDto);
  }

  @Get()
  findAll() {
    return this.serviceBookingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceBookingService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateServiceBookingDto: UpdateServiceBookingDto) {
    return this.serviceBookingService.update(id, updateServiceBookingDto);
  }

  @Patch(':id/confirm')
  confirmCompletion(@Param('id') id: string, @Body() confirmServiceCompletionDto: ConfirmServiceCompletionDto) {
    return this.serviceBookingService.confirmServiceCompletion(id, confirmServiceCompletionDto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.serviceBookingService.cancel(id);
  }
}

