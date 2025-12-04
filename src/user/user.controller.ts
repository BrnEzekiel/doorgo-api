import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User as AuthUser } from '../common/decorators/user.decorator';

@Controller('users') // Changed from 'user' to 'users' for RESTful consistency
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

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


