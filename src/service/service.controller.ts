import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service'; // Import CloudinaryService

@Controller('services')
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly cloudinaryService: CloudinaryService, // Inject CloudinaryService
  ) {}

  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('images')) // 'images' is the field name for the array of files
  async uploadImages(@UploadedFiles() files: Array<Express.Multer.File>) {
    const imageUrls = await this.serviceService.uploadImages(files);
    return { imageUrls };
  }

  @Post()
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  @Get()
  findAll() {
    return this.serviceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }

  @Get('provider/:providerId')
  findByProviderId(@Param('providerId') providerId: string) {
    return this.serviceService.findByProviderId(providerId);
  }
}

