import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming user is attached to the request by an AuthGuard

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    // Fetch the full user details to ensure we have the latest subscription status
    return this.prisma.user.findUnique({ where: { id: user.id } })
      .then(fullUser => {
        if (!fullUser) {
          throw new UnauthorizedException('User not found.');
        }

        // Check if the user is a landlord
        if (!fullUser.role.includes('landlord')) {
          throw new UnauthorizedException('Only landlords can access this resource.');
        }

        // Check subscription status
        if (fullUser.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
          throw new UnauthorizedException('Landlord subscription is not active. Please subscribe to access this feature.');
        }

        return true;
      });
  }
}
