import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RentPaymentService } from './rent-payment.service';
import { CreateRentPaymentDto } from './dto/create-rent-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rent-payments')
export class RentPaymentController {
  constructor(private readonly rentPaymentService: RentPaymentService) {}

  @Post()
  create(@Body() createRentPaymentDto: CreateRentPaymentDto) {
    return this.rentPaymentService.create(createRentPaymentDto);
  }
}
