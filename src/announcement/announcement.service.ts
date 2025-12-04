import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  create(createAnnouncementDto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({ data: createAnnouncementDto });
  }

  findAll() {
    return this.prisma.announcement.findMany({
      include: { hostel: true },
    });
  }

  findByHostel(hostelId: string) {
    return this.prisma.announcement.findMany({
      where: { hostelId },
    });
  }

  findOne(id: string) {
    return this.prisma.announcement.findUnique({
      where: { id },
      include: { hostel: true },
    });
  }

  update(id: string, updateAnnouncementDto: UpdateAnnouncementDto) {
    return this.prisma.announcement.update({
      where: { id },
      data: updateAnnouncementDto,
    });
  }

  remove(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
