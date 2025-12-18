import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator

@Controller('users') // Changed from 'user' to 'users' for RESTful consistency
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'landlord', 'service_provider', 'caretaker') // All roles can view
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: any) {
    // A user can view their own profile, or an admin can view any profile
    if (id === authUser.userId || authUser.role.includes('admin')) {
      return this.userService.findOne(id);
    }
    throw new UnauthorizedException('You are not authorized to view this profile.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'landlord', 'service_provider', 'caretaker')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @AuthUser() authUser: any) {
    // A user can update their own profile, or an admin can update any profile
    if (id === authUser.userId || authUser.role.includes('admin')) {
      return this.userService.update(id, updateUserDto);
    }
    throw new UnauthorizedException('You are not authorized to update this profile.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/withdraw')
  requestWithdrawal(
    @Param('id') id: string,
    @AuthUser() authUser: any, // Using any for now, but should be a typed user object
    @Body() requestWithdrawalDto: RequestWithdrawalDto,
  ) {
    if (id !== authUser.userId) { // Ensure user is requesting withdrawal for themselves
      throw new UnauthorizedException('You can only request withdrawal for your own account.');
    }
    return this.userService.requestWithdrawal(id, requestWithdrawalDto);
  }
}


