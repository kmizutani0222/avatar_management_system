import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { OAuthClientsController } from './oauth-clients.controller';
import { OAuthClientsService } from './oauth-clients.service';

@Module({
  imports: [AuthModule],
  controllers: [ApiKeysController, OAuthClientsController],
  providers: [ApiKeysService, OAuthClientsService],
  exports: [OAuthClientsService],
})
export class OperatorModule {}
