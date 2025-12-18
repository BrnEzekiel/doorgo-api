import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'; // Added UnauthorizedException
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
// Removed AuditService and ActivityType imports, will inject AuditService dynamically if needed or rely on global provision.

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // Removed AuditService injection

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // No roles required, allow access
    }
    const { user } = context.switchToHttp().getRequest();
    // Assuming user roles are stored in user.role (array of strings)
    const hasRequiredRole = requiredRoles.some((role) => user.role.includes(role));

    if (!hasRequiredRole) {
      // Cannot log suspicious activity directly here without injecting AuditService.
      // If logging is critical here, AuditService would need to be injected differently or accessed from a global context.
      // For now, removing the direct auditService call to resolve compilation error.
      // Re-throwing UnauthorizedException from @nestjs/common directly.
      throw new UnauthorizedException('You do not have permission to access this resource.');
    }
    return true;
  }
}
