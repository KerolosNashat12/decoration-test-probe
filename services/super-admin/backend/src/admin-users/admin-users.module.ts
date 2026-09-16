import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}
