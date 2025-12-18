import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Injectable, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../audit/audit.service';
import { ActivityType } from '@prisma/client';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    private auditService: AuditService,
    @Inject('THROTTLER_OPTIONS') protected readonly options: ThrottlerModuleOptions,
    protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const userId = request.user ? request.user.id : null; // Assuming user is available if authenticated
    const route = request.url;

    try {
      // Call the original ThrottlerGuard's canActivate method
      const activated = await super.canActivate(context); // Pass context only
      return activated;
    } catch (e) {
      if (e instanceof UnauthorizedException && e.message === 'ThrottlerException: Too Many Requests') {
        // Log the rate limit block
        const globalThrottlerOptions = (this.options as { throttlers: ThrottlerOptions[] }).throttlers[0]; // Access global options directly

        this.auditService.logSuspiciousActivity(
          ActivityType.RATE_LIMIT_BLOCK,
          `Rate limit blocked request for IP: ${ip} on route: ${route}`,
          { ipAddress: ip, userId, route, limit: globalThrottlerOptions.limit, ttl: globalThrottlerOptions.ttl },
          userId,
          ip,
        );
      }
      throw e; // Re-throw the original exception
    }
  }
}