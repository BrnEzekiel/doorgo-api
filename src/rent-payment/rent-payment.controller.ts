import { Controller, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { RentPaymentService } from './rent-payment.service';
import { CreateRentPaymentDto } from './dto/create-rent-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { User as AuthUser } from '../common/decorators/user.decorator'; // Import AuthUser decorator
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard) // Add RolesGuard at controller level
@Controller('rent-payments')
export class RentPaymentController {
  constructor(private readonly rentPaymentService: RentPaymentService) {}

  @Roles('landlord', 'caretaker', 'admin') // Admin can also create payments
  @Post()
  async create(@Body() createRentPaymentDto: CreateRentPaymentDto, @AuthUser() authUser: User) {
    // Additional authorization logic can be added in service layer to ensure
    // landlord/caretaker is associated with the hostel where this rent payment is logged.
    return this.rentPaymentService.create(createRentPaymentDto);
  }
}
