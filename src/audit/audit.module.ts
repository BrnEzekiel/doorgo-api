import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../prisma/prisma.module'; // Import PrismaModule

@Module({
  imports: [PrismaModule], // Import PrismaModule
  providers: [AuditService],
  exports: [AuditService], // Export AuditService to be used in other modules
})
export class AuditModule {}
