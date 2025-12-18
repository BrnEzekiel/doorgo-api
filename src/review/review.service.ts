import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto, reviewer: User) {
    const { rating, comment, maintenanceRequestId, providerId } = createReviewDto;

    const maintenanceRequest = await this.prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
    });

    if (!maintenanceRequest) {
      throw new NotFoundException(`Maintenance request with ID ${maintenanceRequestId} not found.`);
    }

    if (maintenanceRequest.userId !== reviewer.id) {
      throw new UnauthorizedException('You can only review maintenance requests you created.');
    }

    if (maintenanceRequest.assignedProviderId !== providerId) {
      throw new UnauthorizedException('You can only review the assigned provider for this maintenance request.');
    }

    const review = await this.prisma.serviceReview.create({
      data: {
        rating,
        comment,
        maintenanceRequestId,
        providerId,
        reviewerId: reviewer.id,
      },
    });

    return review;
  }

  async getReviewsForProvider(providerId: string) {
    return this.prisma.serviceReview.findMany({
      where: { providerId },
      include: {
        reviewer: true,
      },
    });
  }
}
