import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service'; // Import NotificationService
import { decrypt } from '../common/utils/encryption.util'; // Import decrypt

@Injectable()
export class SchedulerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService, // Inject NotificationService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleInvoiceGeneration() {
    const activeBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        room: true,
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    for (const booking of activeBookings) {
      const now = new Date();
      const lastInvoice = booking.invoices[0];
      let shouldGenerate = false;

      if (!lastInvoice) {
        shouldGenerate = true;
      } else {
        const lastInvoiceDate = new Date(lastInvoice.createdAt);
        if (booking.billingCycle === 'monthly') {
          lastInvoiceDate.setMonth(lastInvoiceDate.getMonth() + 1);
          if (now >= lastInvoiceDate) {
            shouldGenerate = true;
          }
        } else if (booking.billingCycle === 'semester') {
          lastInvoiceDate.setMonth(lastInvoiceDate.getMonth() + 4); // Assuming a 4-month semester
          if (now >= lastInvoiceDate) {
            shouldGenerate = true;
          }
        }
      }

      if (shouldGenerate) {
        const amount = booking.billingCycle === 'monthly' ? booking.room.monthlyRent : booking.room.semesterRent;
        if (amount) {
          await this.prisma.invoice.create({
            data: {
              booking: { connect: { id: booking.id } },
              amount,
              dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5), // Due date is 5th of next month
            },
          });
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM) // Runs every day at 2 AM
  async checkOverdueRent() {
    const now = new Date();
    const overdueRentStatuses = await this.prisma.rentStatus.findMany({
      where: {
        paymentStatus: 'Due',
        nextDueDate: {
          lt: now, // nextDueDate is in the past
        },
      },
      include: {
        user: true,
        hostel: {
          include: {
            owner: true, // Include landlord details
          },
        },
      },
    });

    for (const rentStatus of overdueRentStatuses) {
      // Update status to 'Overdue'
      await this.prisma.rentStatus.update({
        where: { id: rentStatus.id },
        data: { paymentStatus: 'Overdue' },
      });

      // Send notifications
      const tenantEmail = rentStatus.user.email;
      const landlordEmail = rentStatus.hostel.owner.email;
      const tenantPhone = rentStatus.user.phone;
      const landlordPhone = rentStatus.hostel.owner.phone;

      // Notify Tenant
      if (tenantPhone) {
        await this.notificationService.sendWhatsAppNotification(
          tenantPhone,
          `Your rent for ${rentStatus.hostel.name} is now overdue. Amount: KES ${rentStatus.rentAmount}. Please make your payment soon.`
        );
      }
      if (tenantEmail) {
        await this.notificationService.sendEmailNotification(
          tenantEmail,
          'Rent Overdue Notification',
          `Dear ${rentStatus.user.firstName},\n\nYour rent for ${rentStatus.hostel.name} (amount: KES ${rentStatus.rentAmount}) is now overdue. Please make your payment as soon as possible to avoid further charges.\n\nThank you,\nDoorGo Management`
        );
      }

      // Notify Landlord
      if (landlordPhone) {
        await this.notificationService.sendWhatsAppNotification(
          landlordPhone,
          `Rent for tenant ${decrypt(rentStatus.user.firstName)} ${decrypt(rentStatus.user.lastName)} in ${rentStatus.hostel.name} is now overdue. Amount: KES ${rentStatus.rentAmount}.`
        );
      }
      if (landlordEmail) {
        await this.notificationService.sendEmailNotification(
          landlordEmail,
          'Tenant Rent Overdue Notification',
          `Dear ${rentStatus.hostel.owner.firstName},\n\nRent for ${decrypt(rentStatus.user.firstName)} ${decrypt(rentStatus.user.lastName)} in ${rentStatus.hostel.name} (amount: KES ${rentStatus.rentAmount}) is now overdue.\n\nRegards,\nDoorGo Management`
        );
      }
    }
  }
}


