import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.module';
import { ROLE_ADMIN } from '../../common/constants';
import { SUPER_ADMIN_KEY } from '../decorators/super-admin.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (user.role !== ROLE_ADMIN) throw new ForbiddenException('Super admin required');

    const admin = await this.prisma.admin.findUnique({ where: { id: user.sub } });
    if (!admin?.isActive || admin.level !== 'super') {
      throw new ForbiddenException('Super admin required');
    }
    return true;
  }
}
