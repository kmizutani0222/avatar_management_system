import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { OperatorActiveGuard } from './guards/operator-active.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { OAuthTokenGuard } from './guards/oauth-token.guard';
import { UserSessionExternalGuard } from './guards/user-session-external.guard';
import { ExternalAuthGuard } from './guards/external-auth.guard';
import { OriginCheckService } from '../common/origin-check.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    OperatorActiveGuard,
    OriginCheckService,
    ApiKeyGuard,
    OAuthTokenGuard,
    UserSessionExternalGuard,
    ExternalAuthGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    RolesGuard,
    OperatorActiveGuard,
    ApiKeyGuard,
    OAuthTokenGuard,
    UserSessionExternalGuard,
    ExternalAuthGuard,
  ],
})
export class AuthModule {}
