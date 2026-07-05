import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ROLE_OPERATOR } from '../../common/constants';

@Injectable()
export class OperatorActiveGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;
    if (!user || user.role !== ROLE_OPERATOR) return true;

    const operator = await this.prisma.operator.findUnique({ where: { id: user.sub } });
    if (!operator || operator.status !== 'active') {
      throw new ForbiddenException('Operator account is not active');
    }
    return true;
  }
}
