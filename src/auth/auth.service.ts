import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs
import * as speakeasy from 'speakeasy'; // Import speakeasy
import * as qrcode from 'qrcode'; // Import qrcode
import { encrypt, decrypt } from '../common/utils/encryption.util'; // Import encryption utility
import { AuditService } from '../audit/audit.service'; // Import AuditService
import { ActivityType } from '@prisma/client'; // Import ActivityType

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService, // Inject AuditService
  ) {}

  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled for this user.');
    }

    const secret = speakeasy.generateSecret({
      name: 'DoorGo', // Your application name
    });

    // Save the secret temporarily to the user, but don't enable 2FA yet
    // The user needs to verify the token first
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const otpAuthUrl = secret.otpauth_url;

    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    return {
      secret: secret.base32,
      otpAuthUrl,
      qrCodeDataUrl,
    };
  }

  async enableTwoFactorAuth(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication secret not generated.');
    }
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled.');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1, // Allow 1-time step difference
    });

    if (!verified) {
      await this.auditService.logSuspiciousActivity(
        ActivityType.FAILED_LOGIN, // Consider 2FA failure as a type of failed login
        `Failed 2FA token verification for user: ${user.email}`,
        { userId, token },
        userId,
      );
      throw new UnauthorizedException('Invalid 2FA token.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { message: 'Two-factor authentication enabled successfully.' };
  }

  async disableTwoFactorAuth(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled for this user.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null, // Clear the secret when disabling
      },
    });

    return { message: 'Two-factor authentication disabled successfully.' };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10); // Hash with a salt round of 10
  }

  private async _getTokens(userId: string, email: string, roles: string[]): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { userId, email, role: roles };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // Access token expires in 15 minutes
      secret: process.env.JWT_ACCESS_SECRET,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d', // Refresh token expires in 30 days
      secret: process.env.JWT_REFRESH_SECRET,
    });
    return { accessToken, refreshToken };
  }

  // Helper to hash refresh token
  private async hashData(data: string): Promise<string> {
    return bcrypt.hash(data, 10);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async requestOtp(email: string): Promise<{ message: string }> {
    console.log(`requestOtp called for email: ${email}`); // Added log
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    await this.prisma.user.update({
      where: { email },
      data: { otp, otpExpires },
    });

    // In a real application, integrate with an email service to send the OTP
    // For now, we'll log it or use a mock sender
    console.log(`Sending OTP ${otp} to ${email}`);
    await this.notificationService.sendEmailNotification(email, 'Your OTP for DoorGo', `Your OTP is: ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string): Promise<{ message: string; accessToken: string; refreshToken: string; user: any }> {
    const user = await this.prisma.user.findUnique({ 
      where: { email },
      include: { caretakerFor: true } 
    });

    if (!user || user.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (user.otpExpires < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    await this.prisma.user.update({
      where: { email },
      data: { otp: null, otpExpires: null },
    });

    const { accessToken, refreshToken } = await this._getTokens(user.id, user.email, user.role);
    const hashedRefreshToken = await this.hashData(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedRefreshToken,
        refreshTokenExpiresAt,
      },
    });

    // Decrypt sensitive user data before returning
    if (user.firstName) {
      user.firstName = decrypt(user.firstName);
    }
    if (user.lastName) {
      user.lastName = decrypt(user.lastName);
    }

    return { message: 'OTP verified successfully', accessToken, refreshToken, user };
  }

  async register(
    email: string,
    firstName: string,
    lastName: string,
    phone: string, // Assuming phone is also part of registration
    password_plain: string,
    role: string,
    roleSpecificData: any,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const hashedPassword = await this.hashPassword(password_plain); // Hash the password

    const initialRoles = [role];
    if (role === 'service_provider' && !initialRoles.includes('tenant')) {
      initialRoles.push('tenant');
    }

    const encryptedFirstName = encrypt(firstName);
    const encryptedLastName = encrypt(lastName);
    const encryptedPhone = encrypt(phone);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          firstName: encryptedFirstName,
          lastName: encryptedLastName,
          phone: encryptedPhone,
          password: hashedPassword,
          role: initialRoles, // Use the potentially modified roles array
          ...roleSpecificData,
        },
      });

      const { accessToken, refreshToken } = await this._getTokens(user.id, user.email, user.role);
      const hashedRefreshToken = await this.hashData(refreshToken);
      const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          hashedRefreshToken,
          refreshTokenExpiresAt,
        },
      });

      // Decrypt sensitive user data before returning
      if (user.firstName) {
        user.firstName = decrypt(user.firstName);
      }
      if (user.lastName) {
        user.lastName = decrypt(user.lastName);
      }
      return { accessToken, refreshToken, user };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already in use.');
      }
      throw error;
    }
  }

  async login(email: string, password_plain: string): Promise<{ accessToken?: string; refreshToken?: string; user: any; twoFactorRequired?: boolean }> {
    console.log('--- Login: Start ---');
    console.log(`Login attempt for email: ${email}`);
    try {
      const user = await this.prisma.user.findUnique({ 
        where: { email },
        include: { caretakerFor: true } 
      });

      if (!user) {
        console.log('Login: User not found, throwing UnauthorizedException.');
        throw new UnauthorizedException('Invalid credentials');
      }
      console.log('Login: User found.');

      const isPasswordValid = await this.comparePassword(password_plain, user.password);

      if (!isPasswordValid) {
        console.log('Login: Invalid password, logging suspicious activity and throwing UnauthorizedException.');
        await this.auditService.logSuspiciousActivity(
          ActivityType.FAILED_LOGIN,
          `Failed login attempt for user: ${email}`,
          { email, ipAddress: 'N/A' }, // IP address would come from request context
          user ? user.id : null,
        );
        throw new UnauthorizedException('Invalid credentials');
      }
      console.log('Login: Password valid.');

      if (user.isTwoFactorEnabled && user.twoFactorSecret) {
        console.log('Login: 2FA enabled, returning twoFactorRequired.');
        // If 2FA is enabled, don't return accessToken yet. Frontend will ask for 2FA token.
        return { user, twoFactorRequired: true };
      }

      console.log('Login: Generating tokens.');
      const { accessToken, refreshToken } = await this._getTokens(user.id, user.email, user.role);
      const hashedRefreshToken = await this.hashData(refreshToken);
      const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      console.log('Login: Updating user with hashedRefreshToken and refreshTokenExpiresAt.');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          hashedRefreshToken,
          refreshTokenExpiresAt,
        },
      });
      console.log('Login: User updated with refresh token info.');

      // Decrypt sensitive user data before returning
      // NOTE: This decryption is not robust. It should only decrypt if the data was actually encrypted.
      // And the encrypted data type needs to be handled properly.
      // Assuming `user.firstName` and `user.lastName` might be encrypted.
      const decryptedUser = { ...user };
      if (decryptedUser.firstName) {
        try {
          decryptedUser.firstName = decrypt(decryptedUser.firstName);
        } catch (e) {
          console.warn(`Login: Failed to decrypt firstName for user ${user.id}: ${e.message}`);
          // Keep original encrypted value or set to null/undefined if decryption failed
          decryptedUser.firstName = 'Undecryptable'; // Or keep original value
        }
      }
      if (decryptedUser.lastName) {
        try {
          decryptedUser.lastName = decrypt(decryptedUser.lastName);
        } catch (e) {
          console.warn(`Login: Failed to decrypt lastName for user ${user.id}: ${e.message}`);
          // Keep original encrypted value or set to null/undefined if decryption failed
          decryptedUser.lastName = 'Undecryptable'; // Or keep original value
        }
      }
      console.log('Login: User data potentially decrypted before returning.');
      console.log('--- Login: End (Success) ---');
      return { accessToken, refreshToken, user: decryptedUser };
    } catch (error) {
      console.error('Login: An unexpected error occurred during login process:', error);
      // Re-throw the error or throw a generic UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw if it's already an UnauthorizedException
      }
      throw new UnauthorizedException('An unexpected error occurred during login.');
    }
  }

  async validateTwoFactorCode(userId: string, twoFactorToken: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { caretakerFor: true }
    });

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication not enabled for this user.');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorToken,
      window: 1,
    });

    if (!verified) {
      await this.auditService.logSuspiciousActivity(
        ActivityType.FAILED_LOGIN,
        `Failed 2FA login verification for user: ${user.email}`,
        { userId, twoFactorToken },
        userId,
      );
      throw new UnauthorizedException('Invalid Two-Factor token.');
    }

    const { accessToken, refreshToken } = await this._getTokens(user.id, user.email, user.role);
    const hashedRefreshToken = await this.hashData(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedRefreshToken,
        refreshTokenExpiresAt,
      },
    });

    // Decrypt sensitive user data before returning
    if (user.firstName) {
      user.firstName = decrypt(user.firstName);
    }
    if (user.lastName) {
      user.lastName = decrypt(user.lastName);
    }

    return { accessToken, refreshToken, user };
  }

  async guestLogin(): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    // Create a temporary guest user or retrieve a pre-defined one
    // For simplicity, let's create a new temporary user for each guest session
    const guestEmail = `guest_${Date.now()}@example.com`;
    const guestPassword = Math.random().toString(36).substring(2, 15);
    const hashedPassword = await this.hashPassword(guestPassword);

    const guestUser = await this.prisma.user.create({
      data: {
        email: guestEmail,
        password: hashedPassword,
        firstName: encrypt('Guest'),
        lastName: encrypt('User'),
        phone: encrypt('0000000000'),
        role: ['tenant'], // Guest users are tenants
      },
    });

    const { accessToken, refreshToken } = await this._getTokens(guestUser.id, guestUser.email, guestUser.role);
    const hashedRefreshToken = await this.hashData(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // Guest token valid for 1 hour

    await this.prisma.user.update({
      where: { id: guestUser.id },
      data: {
        hashedRefreshToken,
        refreshTokenExpiresAt,
      },
    });

    // Decrypt sensitive user data before returning
    if (guestUser.firstName) {
      guestUser.firstName = decrypt(guestUser.firstName);
    }
    if (guestUser.lastName) {
      guestUser.lastName = decrypt(guestUser.lastName);
    }

    return { accessToken, refreshToken, user: guestUser };
  }
  async refreshTokens(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    console.log('--- refreshTokens: Start ---');
    console.log(`refreshTokens: Attempting to refresh token for userId: ${userId}`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log('refreshTokens: User not found, throwing UnauthorizedException.');
      throw new UnauthorizedException('Access Denied');
    }
    if (!user.hashedRefreshToken) {
      console.log('refreshTokens: User has no hashedRefreshToken, throwing UnauthorizedException.');
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!refreshTokenMatches) {
      console.log('refreshTokens: Refresh token mismatch, throwing UnauthorizedException.');
      throw new UnauthorizedException('Access Denied');
    }

    // Check if refresh token has expired
    if (user.refreshTokenExpiresAt < new Date()) {
      console.log('refreshTokens: Refresh token expired on server, invalidating and throwing UnauthorizedException.');
      // Invalidate the expired refresh token
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          hashedRefreshToken: null,
          refreshTokenExpiresAt: null,
        },
      });
      throw new UnauthorizedException('Refresh token expired. Please log in again.');
    }

    console.log('refreshTokens: Refresh token valid, generating new tokens.');
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this._getTokens(user.id, user.email, user.role);
    const newHashedRefreshToken = await this.hashData(newRefreshToken);
    const newRefreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedRefreshToken: newHashedRefreshToken,
        refreshTokenExpiresAt: newRefreshTokenExpiresAt,
      },
    });
    console.log('refreshTokens: New tokens generated and saved for user.');
    console.log('--- refreshTokens: End ---');
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.updateMany({
      where: { id: userId, hashedRefreshToken: { not: null } },
      data: {
        hashedRefreshToken: null,
        refreshTokenExpiresAt: null,
      },
    });
    return { message: 'Logged out successfully.' };
  }
}



