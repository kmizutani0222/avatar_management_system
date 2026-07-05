import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperatorModule } from '../operator/operator.module';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [AuthModule, OperatorModule],
  controllers: [OAuthController],
  providers: [OAuthService],
})
export class OAuthModule {}
