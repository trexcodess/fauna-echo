import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  UnauthorizedException,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { RequestWithUser } from './interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() registerDto: RegisterDto) {
    // 1. Matches React fetch('http://localhost:3001/auth/signup')
    return await this.authService.register(registerDto);
  }

 @UseGuards(LocalAuthGuard)
  @Post('signin')
  async signin(@Request() req: RequestWithUser) {
    return await this.authService.login({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name || 'Agent', // <--- Add fallback here
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

@Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    const payload = this.authService.verifyToken(refreshToken);

    if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub as string;
    const user = await this.authService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return await this.authService.login({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || 'Agent',
    });
  }
}