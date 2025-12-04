import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service'; // Import CloudinaryService

@Injectable()
export class ServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.cloudinaryService.uploadFile(file));
    const results = await Promise.all(uploadPromises);
    return results.map(result => result.secure_url);
  }

  create(createServiceDto: CreateServiceDto) {
    return this.prisma.service.create({ data: createServiceDto });
  }

  findAll() {
    return this.prisma.service.findMany({ include: { category: true, provider: true } });
  }

  findOne(id: string) {
    return this.prisma.service.findUnique({ where: { id }, include: { category: true, provider: true } });
  }

  update(id: string, updateServiceDto: UpdateServiceDto) {
    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  remove(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }

  findByProviderId(providerId: string) {
    return this.prisma.service.findMany({ where: { providerId }, include: { category: true } });
  }
}

