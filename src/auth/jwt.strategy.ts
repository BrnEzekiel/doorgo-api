// doorgo-api/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    console.log('JwtStrategy - JWT_ACCESS_SECRET for secretOrKey:', process.env.JWT_ACCESS_SECRET);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: { userId: string, email: string, role: string[] }) { // Added role to payload type for better typing
    console.log('--- JwtStrategy: validate Start ---');
    console.log('JwtStrategy: Validating payload:', payload);
    try {
      const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        console.log(`JwtStrategy: User with ID ${payload.userId} not found in DB, throwing UnauthorizedException.`);
        throw new UnauthorizedException();
      }
      console.log(`JwtStrategy: User ${user.email} (ID: ${user.id}) found.`);
      console.log('--- JwtStrategy: validate End ---');
      // In NestJS, whatever is returned from validate is attached to req.user
      // We need to ensure the role is also available in req.user for RolesGuard.
      // The payload already contains the role. We can attach the user's role from the DB or payload.
      return { userId: user.id, email: user.email, role: user.role }; // Return a simplified user object, including role
    } catch (error) {
      console.error('JwtStrategy: Error during validation:', error);
      throw new UnauthorizedException(); // Re-throw or throw a more specific error
    }
  }
}
