import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NotificationModule } from '../notification/notification.module';
import { JwtStrategy } from './jwt.strategy'; // Will create this next
import { AuditModule } from '../audit/audit.module'; // Import AuditModule

@Module({
  imports: [
    NotificationModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    AuditModule, // Import AuditModule
  ],
  providers: [AuthService, JwtStrategy], // Add JwtStrategy here
  controllers: [AuthController],
  exports: [AuthService], // Export AuthService for use in other modules
})
export class AuthModule {}

