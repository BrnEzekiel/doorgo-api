import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service'; // Import PrismaService
import { CustomLoggerService } from './common/logger/custom-logger.service'; // Import CustomLoggerService

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService, // Inject PrismaService
    private readonly logger: CustomLoggerService, // Inject CustomLoggerService
  ) {} // Inject PrismaService

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<{ status: string }> {
    try {
      await this.prisma.user.count(); // Attempt to query the database
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Database connection failed:', error.stack || error.message, 'AppService');
      return { status: 'database error' };
    }
  }
}
