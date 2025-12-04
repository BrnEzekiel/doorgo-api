import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10); // Hash with a salt round of 10
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async requestOtp(email: string): Promise<{ message: string }> {
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

  async verifyOtp(email: string, otp: string): Promise<{ message: string; accessToken: string; user: any }> {
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

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { message: 'OTP verified successfully', accessToken, user };
  }

  async register(
    email: string,
    firstName: string,
    lastName: string,
    password_plain: string,
    role: string,
    roleSpecificData: any,
  ): Promise<{ accessToken: string; user: any }> {
    const hashedPassword = await this.hashPassword(password_plain); // Hash the password

    const user = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: [role],
        ...roleSpecificData,
      },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }

  async login(email: string, password_plain: string): Promise<{ accessToken: string; user: any }> {
    const user = await this.prisma.user.findUnique({ 
      where: { email },
      include: { caretakerFor: true } 
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(password_plain, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }

  async guestLogin(): Promise<{ accessToken: string; user: any }> {
    const guestEmail = 'guest@doorgo.com';
    let user = await this.prisma.user.findUnique({
      where: { email: guestEmail },
    });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await this.hashPassword(randomPassword); // Hash guest password
      user = await this.prisma.user.create({
        data: {
          email: guestEmail,
          firstName: 'Guest',
          lastName: 'User',
          password: hashedPassword,
          role: ['student'],
        },
      });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }
}


