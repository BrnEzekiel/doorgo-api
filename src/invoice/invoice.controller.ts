import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  NotFoundException, // Added NotFoundException for findOne logic
} from '@nestjs/common'; // Added UseGuards, UnauthorizedException, NotFoundException
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord')
  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'landlord')
  @Get()
  async findAll(@AuthUser() authUser: User) {
    if (authUser.role.includes('admin')) {
      return this.invoiceService.findAll();
    } else if (authUser.role.includes('tenant')) {
      return this.invoiceService.findByTenantId(authUser.id);
    } else if (authUser.role.includes('landlord')) {
      return this.invoiceService.findByLandlordId(authUser.id);
    }
    throw new UnauthorizedException('You are not authorized to view invoices.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tenant', 'landlord')
  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() authUser: User) {
    const invoice = await this.invoiceService.findOne(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }

    if (authUser.role.includes('admin')) {
      return invoice;
    }
    if (authUser.role.includes('tenant') && invoice.booking.leadTenantId === authUser.id) {
      return invoice;
    }
    if (authUser.role.includes('landlord') && invoice.booking.room.hostel.ownerId === authUser.id) {
      return invoice;
    }
    throw new UnauthorizedException('You are not authorized to view this invoice.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'landlord')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto, @AuthUser() authUser: User) {
    const invoice = await this.invoiceService.findOne(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }

    if (authUser.role.includes('admin')) {
      return this.invoiceService.update(id, updateInvoiceDto);
    }
    if (authUser.role.includes('landlord') && invoice.booking.room.hostel.ownerId === authUser.id) {
      return this.invoiceService.update(id, updateInvoiceDto);
    }
    throw new UnauthorizedException('You are not authorized to update this invoice.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(id);
  }
}
