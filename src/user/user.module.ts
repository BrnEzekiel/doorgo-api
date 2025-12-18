import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuditModule } from '../audit/audit.module'; // Import AuditModule

@Module({
  imports: [AuditModule], // Import AuditModule
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService] // Export UserService
})
export class UserModule {}
