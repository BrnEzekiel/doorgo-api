import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { encrypt, decrypt } from '../common/utils/encryption.util'; // Import encryption utilities
import { AuditService } from '../audit/audit.service'; // Import AuditService
import { ActivityType, Prisma } from '@prisma/client'; // Import ActivityType, Prisma

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService, // Inject AuditService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const data = { ...createUserDto };
    if (data.firstName) data.firstName = encrypt(data.firstName);
    if (data.lastName) data.lastName = encrypt(data.lastName);
    if (data.phone) data.phone = encrypt(data.phone);
    const newUser = await this.prisma.user.create({ data });

    await this.auditService.logSuspiciousActivity(
      ActivityType.USER_CREATED,
      `New user created: ${newUser.email}`,
      { userId: newUser.id, email: newUser.email, roles: newUser.role },
      newUser.id,
    );
    return newUser;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(user => ({
      ...user,
      firstName: user.firstName ? decrypt(user.firstName) : user.firstName,
      lastName: user.lastName ? decrypt(user.lastName) : user.lastName,
      phone: user.phone ? decrypt(user.phone) : user.phone,
      balance: user.balance.toString(), // Ensure balance is stringified
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            room: {
              include: {
                hostel: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        rentStatus: {
          orderBy: { nextDueDate: 'asc' },
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
        },
        leases: {
          orderBy: { endDate: 'desc' },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Limit to recent notifications
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    // Decrypt sensitive fields
    const decryptedUser: any = {
      ...user,
      firstName: user.firstName ? decrypt(user.firstName) : user.firstName,
      lastName: user.lastName ? decrypt(user.lastName) : user.lastName,
      phone: user.phone ? decrypt(user.phone) : user.phone,
      balance: user.balance.toString(), // Convert Decimal to string for serialization
    };

    if (user.role.includes('service_provider')) {
      const commissionRecords = await this.prisma.commissionRecord.findMany({
        where: { providerId: id },
      });

      const totalGrossEarnings = commissionRecords.reduce((sum, record) => sum.plus(record.amountPaid), new Decimal(0));
      const totalCommissionDeducted = commissionRecords.reduce((sum, record) => sum.plus(record.commissionAmount), new Decimal(0));

      decryptedUser.totalGrossEarnings = totalGrossEarnings.toString();
      decryptedUser.totalCommissionDeducted = totalCommissionDeducted.toString();
    }

    return decryptedUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const data = { ...updateUserDto };
    const changedFields: { fieldName: string; oldValue: string; newValue: string }[] = [];

    // Check and encrypt sensitive fields
    if (data.firstName && data.firstName !== existingUser.firstName) {
      changedFields.push({ fieldName: 'firstName', oldValue: existingUser.firstName, newValue: data.firstName });
      data.firstName = encrypt(data.firstName);
    }
    if (data.lastName && data.lastName !== existingUser.lastName) {
      changedFields.push({ fieldName: 'lastName', oldValue: existingUser.lastName, newValue: data.lastName });
      data.lastName = encrypt(data.lastName);
    }
    if (data.phone && data.phone !== existingUser.phone) {
      changedFields.push({ fieldName: 'phone', oldValue: existingUser.phone, newValue: data.phone });
      data.phone = encrypt(data.phone);
    }

    // Encrypt password if present (already handled by auth service for registration/password reset, but good to check here)
    // IMPORTANT: Password hashing should occur BEFORE this service, e.g., in auth service or a pipe
    if (data.password) {
      // For now, assume password comes hashed or is handled elsewhere. Log change if present.
      changedFields.push({ fieldName: 'password', oldValue: '[REDACTED]', newValue: '[REDACTED]' });
      // If updating password directly here, it needs hashing:
      // data.password = await bcrypt.hash(data.password, 10); // Uncomment if hashing here
    }

    // Handle new profile fields (these are directly mappable to Prisma User model)
    if (data.profilePictureUrl !== undefined && data.profilePictureUrl !== existingUser.profilePictureUrl) {
      changedFields.push({ fieldName: 'profilePictureUrl', oldValue: existingUser.profilePictureUrl, newValue: data.profilePictureUrl });
    }
    if (data.bio !== undefined && data.bio !== existingUser.bio) {
      changedFields.push({ fieldName: 'bio', oldValue: existingUser.bio, newValue: data.bio });
    }
    // Handle portfolioImageUrls separately due to array type
    if (data.portfolioImageUrls !== undefined) {
      // Compare arrays for changes (deep comparison needed for robust check)
      const existingPortfolio = JSON.stringify(existingUser.portfolioImageUrls || []);
      const newPortfolio = JSON.stringify(data.portfolioImageUrls);
      if (existingPortfolio !== newPortfolio) {
        changedFields.push({ fieldName: 'portfolioImageUrls', oldValue: existingPortfolio, newValue: newPortfolio });
      }
    }

    // Construct the data object to update, ensuring only valid Prisma fields are passed
    const updateData: Prisma.UserUpdateInput = {};
    if (data.firstName !== undefined) updateData.firstName = encrypt(data.firstName);
    if (data.lastName !== undefined) updateData.lastName = encrypt(data.lastName);
    if (data.phone !== undefined) updateData.phone = encrypt(data.phone);
    if (data.password !== undefined) updateData.password = data.password; // Assumed already hashed
    if (data.profilePictureUrl !== undefined) updateData.profilePictureUrl = data.profilePictureUrl;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.portfolioImageUrls !== undefined) updateData.portfolioImageUrls = { set: data.portfolioImageUrls };


    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData, // Pass the constructed updateData
    });

    if (changedFields.length > 0) {
      await this.auditService.logSuspiciousActivity(
        ActivityType.USER_PROFILE_UPDATED,
        `User profile updated for user: ${existingUser.email}`,
        { userId: id, changedFields: changedFields.map(f => ({ ...f, oldValue: encrypt(f.oldValue), newValue: encrypt(f.newValue) })) }, // Encrypt old/new values in log
        id,
      );
    }
    return updatedUser;
  }

  async requestWithdrawal(userId: string, requestWithdrawalDto: RequestWithdrawalDto) {
    const { amount, paymentMethod } = requestWithdrawalDto;
    const amountDecimal = new Decimal(amount); // Convert number to Decimal

    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const balance = new Decimal(user.balance || 0);

      if (balance.lessThan(amountDecimal)) {
        throw new BadRequestException('Insufficient balance for withdrawal.');
      }

      // No withdrawal commission applied at this stage as per user's request.
      const commission = new Decimal(0); // Explicitly set commission to 0
      const netAmount = amountDecimal; // Net amount is the full requested amount

      // Update user's balance - deduct the full requested amount
      await prisma.user.update({
        where: { id: userId },
        data: { balance: balance.minus(amountDecimal) },
      });

      // Create withdrawal request record
      const withdrawal = await prisma.withdrawalRequest.create({
        data: {
          userId,
          amount: amountDecimal,
          commission: commission,
          netAmount: netAmount,
          paymentMethod: paymentMethod || user.phone || 'Unknown', // Use provided method or user's phone
          status: 'pending', // Pending approval/processing
        },
      });

      // In a real application, you would integrate with a payout service here (e.g., M-Pesa B2C)
      // For now, it's just recorded as pending.

      return { message: 'Withdrawal request submitted successfully.', withdrawal };
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}


