import { SetMetadata } from '@nestjs/common';
import { AuthRole } from '../../common/constants';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AuthRole[]) => SetMetadata(ROLES_KEY, roles);
