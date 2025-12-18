import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User as AuthUser } from '../common/decorators/user.decorator';
import { User } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant')
  @Post()
  create(@Body() createReviewDto: CreateReviewDto, @AuthUser() user: User) {
    return this.reviewService.create(createReviewDto, user);
  }

  @Get('provider/:providerId')
  getReviewsForProvider(@Param('providerId') providerId: string) {
    return this.reviewService.getReviewsForProvider(providerId);
  }
}
