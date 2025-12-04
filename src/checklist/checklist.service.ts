import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  createChecklist(createChecklistDto: CreateChecklistDto) {
    return this.prisma.checklist.create({ data: createChecklistDto });
  }

  findAll() {
    return this.prisma.checklist.findMany();
  }

  findOne(id: string) {
    return this.prisma.checklist.findUnique({ where: { id } });
  }

  update(id: string, updateChecklistDto: UpdateChecklistDto) {
    return this.prisma.checklist.update({
      where: { id },
      data: updateChecklistDto,
    });
  }

  remove(id: string) {
    return this.prisma.checklist.delete({ where: { id } });
  }
}

