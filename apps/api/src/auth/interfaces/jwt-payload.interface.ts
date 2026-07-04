import { AuthRole } from '../../common/constants';

export interface JwtPayload {
  sub: string;
  role: AuthRole;
  email: string;
}
