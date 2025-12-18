import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Announcement, MaintenanceRequest } from '@prisma/client';

export interface Activity {
  type: 'announcement' | 'maintenance' | 'payment' | 'lease_expiry' | 'lease_expired' | 'rent_overdue' | 'rent_due_soon';
  text: string;
  time: string;
  iconBg: string;
  createdAt: Date;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecentActivity(userId: string): Promise<Activity[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        rentStatus: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        leases: {
          orderBy: { endDate: 'desc' },
          take: 5,
        },
      },
    });

    const announcements = await this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const now = new Date(); // Define now once at the beginning of the function

    const activities: Activity[] = [];

    announcements.forEach((announcement: Announcement) => {
      activities.push({
        type: 'announcement',
        text: `New announcement: "${announcement.title}"`,
        time: this.formatTime(announcement.createdAt),
        iconBg: '#4F46E5',
        createdAt: announcement.createdAt,
      });
    });

    if (user) {
      user.maintenanceRequests.forEach((request: MaintenanceRequest) => {
        activities.push({
          type: 'maintenance',
          text: `Maintenance request #${request.id.substring(0, 4)} status changed to "${request.status}"`,
          time: this.formatTime(request.createdAt),
          iconBg: '#F59E0B',
          createdAt: request.createdAt,
        });
      });

      user.rentStatus.forEach(rentStatus => {
        rentStatus.payments.forEach(payment => {
          activities.push({
            type: 'payment',
            text: `Rent payment of $${payment.amountPaid} received.`,
            time: this.formatTime(payment.createdAt),
            iconBg: '#10B981',
            createdAt: payment.createdAt,
          });
        });
      });

      // Add Lease expiry notifications
      user.leases.forEach(lease => {
        const daysToExpiry = Math.ceil((lease.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToExpiry <= 30 && daysToExpiry > 0) {
          activities.push({
            type: 'lease_expiry',
            text: `Your lease for hostel ${lease.hostelId} expires in ${daysToExpiry} day(s).`,
            time: this.formatTime(lease.endDate),
            iconBg: '#EF4444', // Red for warnings
            createdAt: lease.createdAt, // Or a more relevant date
          });
        } else if (daysToExpiry <= 0 && lease.status === 'Active') { // Already expired but still active in system
          activities.push({
            type: 'lease_expired',
            text: `Your lease for hostel ${lease.hostelId} has expired.`,
            time: this.formatTime(lease.endDate),
            iconBg: '#EF4444',
            createdAt: lease.createdAt,
          });
        }
      });

      // Add Rent Status notifications (overdue/upcoming)
      user.rentStatus.forEach(rentStatus => {
        if (rentStatus.paymentStatus === 'Overdue') {
          activities.push({
            type: 'rent_overdue',
            text: `Rent for hostel ${rentStatus.hostelId} is overdue. Amount: KES ${rentStatus.rentAmount}.`,
            time: this.formatTime(rentStatus.updatedAt),
            iconBg: '#DC2626', // Darker red for overdue
            createdAt: rentStatus.updatedAt,
          });
        } else {
            const daysToDue = Math.ceil((rentStatus.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysToDue <= 7 && daysToDue > 0) {
                activities.push({
                    type: 'rent_due_soon',
                    text: `Rent for hostel ${rentStatus.hostelId} is due in ${daysToDue} day(s). Amount: KES ${rentStatus.rentAmount}.`,
                    time: this.formatTime(rentStatus.nextDueDate),
                    iconBg: '#FCD34D', // Yellow for warning
                    createdAt: rentStatus.nextDueDate,
                });
            }
        }
      });
    }

    // Sort activities by creation date
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activities.slice(0, 10);
  }

  private formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day(s) ago`;
    }
    if (hours > 0) {
      return `${hours} hour(s) ago`;
    }
    if (minutes > 0) {
      return `${minutes} minute(s) ago`;
    }
    return 'Just now';
  }
}