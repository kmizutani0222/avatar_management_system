import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.module';
import { AuthRole, ROLE_ADMIN, ROLE_OPERATOR, ROLE_USER } from '../common/constants';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface TokenPayload extends JwtPayload {}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    if (dto.role === ROLE_USER) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already registered');

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          displayName: dto.displayName ?? dto.email.split('@')[0],
        },
      });
      return this.issueTokens({ sub: user.id, role: ROLE_USER, email: user.email });
    }

    if (dto.role === ROLE_OPERATOR) {
      const existing = await this.prisma.operator.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already registered');

      const operator = await this.prisma.operator.create({
        data: {
          email: dto.email,
          passwordHash,
          companyName: dto.companyName ?? 'Unknown',
          status: 'pending',
        },
      });
      return this.issueTokens({ sub: operator.id, role: ROLE_OPERATOR, email: operator.email });
    }

    throw new UnauthorizedException('Invalid role for registration');
  }

  async login(dto: LoginDto) {
    if (dto.role === ROLE_ADMIN) {
      const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
      if (!admin || !admin.isActive) throw new UnauthorizedException('Invalid credentials');
      const valid = await bcrypt.compare(dto.password, admin.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
      return this.issueTokens({ sub: admin.id, role: ROLE_ADMIN, email: admin.email });
    }

    if (dto.role === ROLE_USER) {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
      return this.issueTokens({ sub: user.id, role: ROLE_USER, email: user.email });
    }

    if (dto.role === ROLE_OPERATOR) {
      const operator = await this.prisma.operator.findUnique({ where: { email: dto.email } });
      if (!operator || operator.status === 'suspended') {
        throw new UnauthorizedException('Invalid credentials');
      }
      const valid = await bcrypt.compare(dto.password, operator.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
      return this.issueTokens({ sub: operator.id, role: ROLE_OPERATOR, email: operator.email });
    }

    throw new UnauthorizedException('Invalid role');
  }

  async getProfile(payload: JwtPayload) {
    if (payload.role === ROLE_ADMIN) {
      const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
      if (!admin || !admin.isActive) throw new UnauthorizedException();
      return {
        id: admin.id,
        email: admin.email,
        role: ROLE_ADMIN as AuthRole,
        displayName: admin.name,
        adminLevel: admin.level,
      };
    }

    if (payload.role === ROLE_USER) {
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException();
      return {
        id: user.id,
        email: user.email,
        role: ROLE_USER as AuthRole,
        displayName: user.displayName,
        xUsername: user.xUsername,
        profileMessage: user.profileMessage,
        hasProfileIcon: Boolean(user.profileIconUrl),
      };
    }

    if (payload.role === ROLE_OPERATOR) {
      const operator = await this.prisma.operator.findUnique({ where: { id: payload.sub } });
      if (!operator || operator.status === 'suspended') throw new UnauthorizedException();
      return {
        id: operator.id,
        email: operator.email,
        role: ROLE_OPERATOR as AuthRole,
        companyName: operator.companyName,
        status: operator.status,
      };
    }

    throw new UnauthorizedException();
  }

  private issueTokens(payload: TokenPayload) {
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      role: payload.role,
    };
  }
}
