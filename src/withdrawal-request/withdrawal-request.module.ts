import { Module } from '@nestjs/common';
import { WithdrawalRequestService } from './withdrawal-request.service';
import { WithdrawalRequestController } from './withdrawal-request.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WithdrawalRequestController],
  providers: [WithdrawalRequestService],
})
export class WithdrawalRequestModule {}
