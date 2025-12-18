import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt } from '../common/utils/encryption.util'; // Import decrypt

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLandlordPremiumAnalytics(userId: string) {
    // This is where you would aggregate data for premium analytics for a landlord
    // For example:
    const hostels = await this.prisma.hostel.findMany({
      where: { ownerId: userId },
      include: {
        rooms: {
          include: {
            bookings: {
              where: { status: 'COMPLETED' }, // Assuming completed bookings contribute to occupancy
            },
          },
        },
        rentStatus: {
          where: { userId: userId },
        },
      },
    });

    let totalRooms = 0;
    let occupiedRooms = 0;
    let totalRentExpected = 0;
    let totalRentCollected = 0;
    let totalRentOverdue = 0;

    for (const hostel of hostels) {
      for (const room of hostel.rooms) {
        totalRooms++;
        if (room.bookings.length > 0) { // Simple check for occupancy
          occupiedRooms++;
        }
      }

      for (const rentStatus of hostel.rentStatus) {
        totalRentExpected += rentStatus.rentAmount;
        if (rentStatus.paymentStatus === 'Paid') {
            totalRentCollected += rentStatus.rentAmount;
        } else if (rentStatus.paymentStatus === 'Overdue') {
            totalRentOverdue += rentStatus.rentAmount;
        }
      }
    }

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const rentCollectionRate = totalRentExpected > 0 ? (totalRentCollected / totalRentExpected) * 100 : 0;

    return {
      totalHostels: hostels.length,
      totalRooms,
      occupiedRooms,
      occupancyRate: parseFloat(occupancyRate.toFixed(2)),
      totalRentExpected: parseFloat(totalRentExpected.toFixed(2)),
      totalRentCollected: parseFloat(totalRentCollected.toFixed(2)),
      totalRentOverdue: parseFloat(totalRentOverdue.toFixed(2)),
      rentCollectionRate: parseFloat(rentCollectionRate.toFixed(2)),
      // Add more complex analytics here (e.g., trends over time, utility consumption, maintenance costs)
    };
  }

  async getIncomeReport(userId: string, startDate: Date, endDate: Date) {
    const rentPayments = await this.prisma.rentPayment.findMany({
      where: {
        rentStatus: {
          hostel: {
            ownerId: userId,
          },
        },
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        rentStatus: {
          include: {
            user: true,
            hostel: true,
          },
        },
      },
    });

    const totalIncome = rentPayments.reduce((acc, payment) => acc + payment.amountPaid, 0);
    const incomeByHostel = rentPayments.reduce((acc, payment) => {
      const hostelName = payment.rentStatus.hostel.name;
      if (!acc[hostelName]) {
        acc[hostelName] = 0;
      }
      acc[hostelName] += payment.amountPaid;
      return acc;
    }, {});

    return {
      totalIncome,
      incomeByHostel,
      reportStartDate: startDate.toISOString(),
      reportEndDate: endDate.toISOString(),
      payments: rentPayments.map(p => ({
        paymentId: p.id,
        tenantName: `${decrypt(p.rentStatus.user.firstName)} ${decrypt(p.rentStatus.user.lastName)}`,
        hostel: p.rentStatus.hostel.name,
        amount: p.amountPaid,
        date: p.paymentDate,
      })),
    };
  }
}
