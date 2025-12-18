import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from '@prisma/client'; // Import ActivityType enum

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logSuspiciousActivity(
    activityType: ActivityType,
    description: string,
    details?: Record<string, any>,
    userId?: string,
    ipAddress?: string,
  ) {
    await this.prisma.suspiciousActivityLog.create({
      data: {
        activityType,
        description,
        details: details ? JSON.stringify(details) : null, // Store JSON details as string
        userId,
        ipAddress,
      },
    });
  }
}
