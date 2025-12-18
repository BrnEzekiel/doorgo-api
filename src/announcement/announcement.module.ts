import { Module } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService

@Module({
  controllers: [AnnouncementController],
  providers: [AnnouncementService, PrismaService], // Add PrismaService
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
