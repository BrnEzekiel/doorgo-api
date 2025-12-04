import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service'; // Import PrismaService

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {} // Inject PrismaService

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<{ status: string }> {
    try {
      await this.prisma.user.count(); // Attempt to query the database
      return { status: 'ok' };
    } catch (error) {
      console.error('Database connection failed:', error);
      return { status: 'database error' };
    }
  }
}
