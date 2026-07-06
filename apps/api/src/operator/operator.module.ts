import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { OAuthClientsController } from './oauth-clients.controller';
import { OAuthClientsService } from './oauth-clients.service';

import { OperatorProfileController } from './operator-profile.controller';
import { OperatorProfileService } from './operator-profile.service';

@Module({
  imports: [AuthModule],
  controllers: [ApiKeysController, OAuthClientsController, OperatorProfileController],
  providers: [ApiKeysService, OAuthClientsService, OperatorProfileService],
  exports: [OAuthClientsService],
})
export class OperatorModule {}
