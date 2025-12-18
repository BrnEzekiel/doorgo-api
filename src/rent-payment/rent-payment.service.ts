import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentPaymentDto } from './dto/create-rent-payment.dto';
import { ReceiptService } from '../receipt/receipt.service'; // Import ReceiptService
import { decrypt } from '../common/utils/encryption.util'; // Import decrypt utility for tenant name

@Injectable()
export class RentPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptService: ReceiptService, // Inject ReceiptService
  ) {}

  async create(createRentPaymentDto: CreateRentPaymentDto) {
    const { rentStatusId, amountPaid } = createRentPaymentDto;

    // Use a transaction to ensure both operations succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      // 1. Verify the rentStatus exists
      const rentStatus = await prisma.rentStatus.findUnique({
        where: { id: rentStatusId },
      });
      if (!rentStatus) {
        throw new NotFoundException(`RentStatus with ID ${rentStatusId} not found.`);
      }

      // 2. Create the RentPayment record
      const rentPayment = await prisma.rentPayment.create({
        data: createRentPaymentDto,
      });

      // 3. Update the RentStatus
      await prisma.rentStatus.update({
        where: { id: rentStatusId },
        data: {
          paymentStatus: 'Paid',
          lastPaymentDate: rentPayment.paymentDate,
        },
      });

      // Fetch details needed for receipt
      const fullRentStatus = await prisma.rentStatus.findUnique({
        where: { id: rentStatusId },
        include: {
          user: true,
          hostel: {
            include: { rooms: true }, // Include rooms to get room number for receipt
          },
        },
      });

      if (fullRentStatus && fullRentStatus.user && fullRentStatus.hostel) {
        // Need to decrypt tenant name for the receipt
        const tenantName = `${decrypt(fullRentStatus.user.firstName)} ${decrypt(fullRentStatus.user.lastName)}`;
        
        // Fetch room number. This is a bit indirect. RentStatus is linked to a user and hostel,
        // but not directly to a room. Assuming the user has one active booking in that hostel for simplicity for now.
        const booking = await prisma.booking.findFirst({
          where: {
            leadTenantId: fullRentStatus.userId,
            roomId: {
              in: fullRentStatus.hostel.rooms.map(room => room.id) // Assuming hostel includes rooms
            }
          },
          select: { room: { select: { roomNumber: true } } }
        });
        const roomNumber = booking?.room?.roomNumber || 'N/A';

        const receiptUrl = await this.receiptService.generateAndUploadReceipt(
          rentPayment.id,
          rentPayment.amountPaid,
          tenantName,
          fullRentStatus.hostel.name,
          roomNumber,
          rentPayment.paymentDate,
        );

        // Update RentPayment with receipt URL
        await prisma.rentPayment.update({
          where: { id: rentPayment.id },
          data: { receiptUrl },
        });
      }

      return rentPayment;
    });
  }
}
