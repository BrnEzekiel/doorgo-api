import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createTransport } from 'nodemailer';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  private transporter;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        ...createNotificationDto,
        sentAt: new Date(),
      },
    });
  }

  findAll() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, updateNotificationDto: UpdateNotificationDto) {
    return this.prisma.notification.update({
      where: { id },
      data: updateNotificationDto,
    });
  }

  async sendSmsNotification(phone: string, message: string) {
    console.log(`Sending SMS to ${phone}: ${message}`);
    // In a real application, integrate with an SMS gateway (e.g., Africa's Talking)
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (user) {
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          message,
          type: 'SMS',
          sentAt: new Date(),
        },
      });
    }
  }

  async sendWhatsAppNotification(phone: string, message: string) {
    console.log(`Sending WhatsApp message to ${phone}: ${message}`);
    // In a real application, integrate with WhatsApp Business API (e.g., Twilio)
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (user) {
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          message,
          type: 'WHATSAPP',
          sentAt: new Date(),
        },
      });
    }
  }

  async sendEmailNotification(email: string, subject: string, message: string) {
    console.log(`Sending Email to ${email} - Subject: ${subject}, Message: ${message}`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject,
      text: message,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        await this.prisma.notification.create({
          data: {
            userId: user.id,
            message: `Subject: ${subject} - ${message}`,
            type: 'EMAIL',
            sentAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Error sending email: ', error);
    }
  }

  getNotificationsByUserId(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}


