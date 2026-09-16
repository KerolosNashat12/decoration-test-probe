import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaControlModule } from './prisma-control/prisma-control.module.js';
import { TenantDbModule } from './tenant-db/tenant-db.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProvisioningModule } from './provisioning/provisioning.module.js';
import { ProfileModule } from './profile/profile.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaControlModule,
    TenantDbModule,
    AuthModule,
    ProvisioningModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
