import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HostelService } from '../hostel/hostel.service';
import { ServiceCategoryService } from '../service-category/service-category.service';
import { BookingService } from '../booking/booking.service';
import { UserService } from '../user/user.service';
import { ServiceService } from '../service/service.service';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hostelService: HostelService,
    private readonly serviceCategoryService: ServiceCategoryService,
    private readonly bookingService: BookingService,
    private readonly userService: UserService,
    private readonly serviceService: ServiceService,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count();
    const totalHostels = await this.prisma.hostel.count();
    const totalBookings = await this.prisma.booking.count();
    const totalServices = await this.prisma.service.count();

    const topServiceCategories = await this.prisma.serviceCategory.findMany({
      include: {
        _count: {
          select: { services: true },
        },
      },
      orderBy: {
        services: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      totalUsers,
      totalHostels,
      totalBookings,
      totalServices,
      topServiceCategories: topServiceCategories.map(cat => ({
        name: cat.name,
        serviceCount: cat._count.services,
      })),
    };
  }

  // Moderation
  async approveHostel(id: string) {
    return this.prisma.hostel.update({ where: { id }, data: { isApproved: true } });
  }

  async rejectHostel(id: string) {
    return this.prisma.hostel.update({ where: { id }, data: { isApproved: false } });
  }

  async approveUser(id: string) {
    return this.prisma.user.update({ where: { id }, data: { isApproved: true } });
  }

  async rejectUser(id: string) {
    return this.prisma.user.update({ where: { id }, data: { isApproved: false } });
  }

  async removeHostel(id: string) {
    return this.hostelService.removeHostel(id);
  }

  async removeUser(id: string) {
    return this.userService.remove(id);
  }

  async removeService(id: string) {
    return this.serviceService.remove(id);
  }

  async approveService(id: string) {
    return this.prisma.service.update({ where: { id }, data: { isApproved: true } });
  }

  async rejectService(id: string) {
    return this.prisma.service.update({ where: { id }, data: { isApproved: false } });
  }

  // Fraud Detection
  async detectSuspiciousRegistrations() {
    const suspiciousUsers = await this.prisma.user.groupBy({
      by: ['phone'],
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });
    return suspiciousUsers;
  }

  async detectSuspiciousCancellations() {
    // This is a placeholder for a more complex fraud detection logic
    // For example, finding service providers with a high cancellation rate
    const suspiciousCancellations = await this.prisma.serviceBooking.groupBy({
      by: ['serviceId'],
      _count: {
        id: true,
      },
      where: {
        status: 'cancelled',
      },
      having: {
        id: {
          _count: {
            gt: 2, // Example: more than 2 cancellations
          },
        },
      },
    });
    return suspiciousCancellations;
  }
}

