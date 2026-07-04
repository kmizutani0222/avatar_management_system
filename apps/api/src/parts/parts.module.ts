import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartsController } from './parts.controller';
import { PartsService } from './parts.service';

@Module({
  imports: [AuthModule],
  controllers: [PartsController],
  providers: [PartsService],
})
export class PartsModule {}
