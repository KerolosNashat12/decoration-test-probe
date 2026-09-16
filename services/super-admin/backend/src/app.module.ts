import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { TenantApplicationsModule } from './tenant-applications/tenant-applications.module.js';
import { AdminUsersModule } from './admin-users/admin-users.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { TenantDashboardModule } from './tenant-dashboard/tenant-dashboard.module.js';
import { MailModule } from './mail/mail.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    TenantApplicationsModule,
    AdminUsersModule,
    DashboardModule,
    TenantDashboardModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
