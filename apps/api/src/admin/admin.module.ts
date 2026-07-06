import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminOperatorsController } from './admin-operators.controller';
import { AdminOperatorsService } from './admin-operators.service';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileService } from './admin-profile.service';
import { AdminAdminsController } from './admin-admins.controller';
import { AdminAdminsService } from './admin-admins.service';

@Module({
  imports: [AuthModule],
  controllers: [
    AdminUsersController,
    AdminOperatorsController,
    AdminProfileController,
    AdminAdminsController,
  ],
  providers: [AdminUsersService, AdminOperatorsService, AdminProfileService, AdminAdminsService],
})
export class AdminModule {}
