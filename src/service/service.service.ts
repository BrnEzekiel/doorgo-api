import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Prisma, Service } from '@prisma/client'; // Import Prisma and Service

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

  async findAll() {
    const services = await this.prisma.service.findMany({
      include: {
        category: true,
        provider: true,
      },
    });

    // Custom sorting to prioritize services with active boosts
    // Custom sorting to prioritize services with active boosts
    services.sort((a, b) => {
      // With visibilityBoosts removed from the schema, this sorting logic might need re-evaluation.
      // For now, removing the boost-specific sorting as the field no longer exists.
      return 0; // Maintain original order
    });

    return services;
  }

  findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        provider: true,
      },
    });
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

