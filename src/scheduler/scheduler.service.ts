import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleInvoiceGeneration() {
    const activeBookings = await this.prisma.booking.findMany({
      where: {
        status: 'confirmed',
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
}

