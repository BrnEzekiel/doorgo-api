import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UtilityBillService } from './utility-bill.service';
import { CreateUtilityBillDto } from './dto/create-utility-bill.dto';
import { UpdateUtilityBillDto } from './dto/update-utility-bill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('utility-bills')
export class UtilityBillController {
  constructor(private readonly utilityBillService: UtilityBillService) {}

  @Post()
  create(@Body() createUtilityBillDto: CreateUtilityBillDto) {
    return this.utilityBillService.create(createUtilityBillDto);
  }

  @Get()
  findAll() {
    return this.utilityBillService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.utilityBillService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.utilityBillService.findByUser(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUtilityBillDto: UpdateUtilityBillDto) {
    return this.utilityBillService.update(id, updateUtilityBillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.utilityBillService.remove(id);
  }
}
