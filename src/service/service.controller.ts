import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, UseGuards, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('services')
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('service_provider')
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() createServiceDto: CreateServiceDto,
    @AuthUser() user: User,
  ) {
    console.log('ServiceController.create - files received:', files); // Added log
    if (files && files.length > 0) {
      const imageUrls = await this.serviceService.uploadImages(files);
      createServiceDto.images = imageUrls;
    }
    createServiceDto.providerId = user.id;
    return this.serviceService.create(createServiceDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('service_provider', 'admin', 'landlord', 'tenant', 'caretaker') // Allow all roles that might need to upload images
  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('images'))
  async uploadImages(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided.');
    }
    const imageUrls = await this.serviceService.uploadImages(files);
    return { imageUrls };
  }

  @Get()
  findAll() {
    return this.serviceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('service_provider', 'admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto, @AuthUser() authUser: User) {
    const service = await this.serviceService.findOne(id);
    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    if (service.providerId !== authUser.id && !authUser.role.includes('admin')) {
      throw new UnauthorizedException('You are not authorized to update this service.');
    }
    return this.serviceService.update(id, updateServiceDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('service_provider', 'admin')
  @Delete(':id')
  async remove(@Param('id') id: string, @AuthUser() authUser: User) {
    const service = await this.serviceService.findOne(id);
    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    if (service.providerId !== authUser.id && !authUser.role.includes('admin')) {
      throw new UnauthorizedException('You are not authorized to remove this service.');
    }
    return this.serviceService.remove(id);
  }

  @Get('provider/:providerId')
  findByProviderId(@Param('providerId') providerId: string) {
    return this.serviceService.findByProviderId(providerId);
  }
}