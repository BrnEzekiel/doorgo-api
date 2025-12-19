import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'; // Import Logger
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name); // Initialize Logger

  constructor(private prisma: PrismaService) {}

  async canActivate( // Make canActivate async
    context: ExecutionContext,
  ): Promise<boolean> { // Change return type to Promise<boolean>
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.debug(`[SubscriptionGuard] User from request: ${JSON.stringify(user)}`); // Log user object

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } }); // Use await

    this.logger.debug(`[SubscriptionGuard] Full user from DB: ${JSON.stringify(fullUser)}`); // Log fullUser object

    if (!fullUser) {
      throw new UnauthorizedException('User not found.');
    }

    this.logger.debug(`[SubscriptionGuard] User roles: ${fullUser.role}`); // Log user roles
    // Check if the user is a landlord
    if (!fullUser.role.includes('landlord')) {
      this.logger.warn(`[SubscriptionGuard] User ${fullUser.email} is not a landlord. Roles: ${fullUser.role}`);
      throw new UnauthorizedException('Only landlords can access this resource.');
    }

    this.logger.debug(`[SubscriptionGuard] User subscription status: ${fullUser.subscriptionStatus}`); // Log subscription status
    // Check subscription status
    // if (fullUser.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
    //   this.logger.warn(`[SubscriptionGuard] Landlord ${fullUser.email} subscription is not active. Status: ${fullUser.subscriptionStatus}`);
    //   throw new UnauthorizedException('Landlord subscription is not active. Please subscribe to access this feature.');
    // }

    this.logger.debug(`[SubscriptionGuard] Access granted for user ${fullUser.email}.`);
    return true;
  }
}
