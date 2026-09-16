import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaControlModule } from './prisma-control/prisma-control.module.js';
import { TenantDbModule } from './tenant-db/tenant-db.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProvisioningModule } from './provisioning/provisioning.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { RfqsModule } from './rfqs/rfqs.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaControlModule,
    TenantDbModule,
    AuthModule,
    ProvisioningModule,
    ProfileModule,
    CatalogModule,
    RfqsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
