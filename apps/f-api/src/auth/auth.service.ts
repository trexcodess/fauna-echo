import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const { password: _, ...result } = user;

    // 1. Generate a token so they are instantly logged in after signing up
    const payload = { email: result.email, sub: result.id };
    const token = this.jwtService.sign(payload);

    // 2. Return EXACTLY what the React frontend expects!
    return {
      token: token,
      user: result,
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const isPasswordValid = await bcrypt.compare(pass, user.password);
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: { id: string; email: string; role: string; name: string }) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    // Update this to also return 'token' and the 'user' object
    return {
      token: this.jwtService.sign(payload), // changed from accessToken
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: user, // <-- Now React will have the name on Login too!
    };
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async findUserById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }
}
