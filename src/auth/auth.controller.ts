import { Controller, Post, Body, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express'; // Import Request, Response
import { Throttle } from '@nestjs/throttler'; // Import Throttle decorator
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'; // Import LoginDto
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Import JwtAuthGuard
import { User as AuthUser } from '../common/decorators/user.decorator'; // Import AuthUser decorator
import { User } from '@prisma/client'; // Import User type
import { JwtService } from '@nestjs/jwt'; // Import JwtService

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @Post('request-otp')
  async requestOtp(@Body('email') email: string) {
    return this.authService.requestOtp(email);
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generateTwoFactorSecret(@AuthUser() user: User) {
    return this.authService.generateTwoFactorSecret(user.id);
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @Post('verify-otp')
  async verifyOtp(@Body('email') email: string, @Body('otp') otp: string, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user, message } = await this.authService.verifyOtp(email, otp);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }); // Set refresh token as httpOnly cookie
    return { accessToken, user, message };
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enableTwoFactorAuth(@AuthUser() user: User, @Body('token') token: string) {
    return this.authService.enableTwoFactorAuth(user.id, token);
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disableTwoFactorAuth(@AuthUser() user: User) {
    return this.authService.disableTwoFactorAuth(user.id);
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { email, firstName, lastName, password, role, ...roleSpecificData } = registerDto;
    const { accessToken, refreshToken, user } = await this.authService.register(email, firstName, lastName, registerDto.phone, password, role, roleSpecificData); // Pass registerDto.phone
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }); // Set refresh token as httpOnly cookie
    return { accessToken, user };
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { email, password } = loginDto;
    const result = await this.authService.login(email, password);

    if (result.twoFactorRequired) {
      // Return user details without accessToken, indicating 2FA is needed
      return { twoFactorRequired: true, user: result.user };
    }
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }); // Set refresh token as httpOnly cookie
    return { accessToken: result.accessToken, user: result.user };
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @Post('2fa/login')
  async twoFactorLogin(@Body('userId') userId: string, @Body('twoFactorToken') twoFactorToken: string, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.validateTwoFactorCode(userId, twoFactorToken);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }); // Set refresh token as httpOnly cookie
    return { accessToken, user };
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @Post('guest-login')
  async guestLogin(@Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.guestLogin();
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }); // Set refresh token as httpOnly cookie
    return { accessToken, user };
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @Post('refresh')
  async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req as any).cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found.');
    }
    const decodedRefreshToken = this.jwtService.decode(refreshToken);
    const userId = decodedRefreshToken.userId;

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this.authService.refreshTokens(userId, refreshToken);
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    return { accessToken: newAccessToken };
  }

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per 60 seconds
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Cast req to any to access user property
    const userId = (req as any).user['userId']; 
    await this.authService.logout(userId);
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    return { message: 'Logout successful.' };
  }
}