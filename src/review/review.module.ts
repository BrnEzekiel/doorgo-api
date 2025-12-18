import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for JWT

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
