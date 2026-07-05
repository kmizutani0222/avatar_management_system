import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BakeModule } from '../bake/bake.module';
import { UserAvatarsController } from './user-avatars.controller';
import { AdminAvatarsController } from './admin-avatars.controller';
import { ExternalAvatarsController } from './external-avatars.controller';
import { AvatarsService } from './avatars.service';

@Module({
  imports: [AuthModule, BakeModule],
  controllers: [UserAvatarsController, AdminAvatarsController, ExternalAvatarsController],
  providers: [AvatarsService],
  exports: [AvatarsService],
})
export class AvatarsModule {}
