import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminOperatorsController } from './admin-operators.controller';
import { AdminOperatorsService } from './admin-operators.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminUsersController, AdminOperatorsController],
  providers: [AdminUsersService, AdminOperatorsService],
})
export class AdminModule {}
