import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WithdrawalRequestService } from './withdrawal-request.service';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('withdrawal-requests')
export class WithdrawalRequestController {
  constructor(private readonly withdrawalRequestService: WithdrawalRequestService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('service_provider')
  @Post()
  create(@Body() createWithdrawalRequestDto: CreateWithdrawalRequestDto, @AuthUser() user: User) {
    return this.withdrawalRequestService.create(createWithdrawalRequestDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAllForUser(@AuthUser() user: User) {
    return this.withdrawalRequestService.findAllForUser(user.id);
  }
}
