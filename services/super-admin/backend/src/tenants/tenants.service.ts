import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantDashboardClientService } from '../tenant-dashboard/tenant-dashboard-client.service.js';
import { MailService } from '../mail/mail.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantDashboardClient: TenantDashboardClientService,
    private readonly mail: MailService,
  ) {}

  // Super Admin adding a tenant directly (not via a public application).
  create(dto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: { ...dto, status: 'APPROVED', reviewedAt: new Date() },
    });
  }

  findAll(status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED') {
    return this.prisma.tenant.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async suspend(id: string) {
    await this.findOne(id);
    const tenant = await this.prisma.tenant.update({ where: { id }, data: { status: 'SUSPENDED' } });
    // Best-effort: if this tenant has dashboard access, lock it too, so
    // suspending here actually stops them from using their Tenant
    // Dashboard login â not just from showing as "approved" in this
    // registry. Never blocks the suspend action itself (see
    // TenantDashboardClientService.setDashboardAccountActive).
    if (tenant.dashboardUserEmail) {
      await this.tenantDashboardClient.setDashboardAccountActive(id, false);
    }
    return tenant;
  }

  async reactivate(id: string) {
    await this.findOne(id);
    const tenant = await this.prisma.tenant.update({ where: { id }, data: { status: 'APPROVED' } });
    if (tenant.dashboardUserEmail) {
      await this.tenantDashboardClient.setDashboardAccountActive(id, true);
    }
    return tenant;
  }

  // Retry path for a tenant that was approved but never got dashboard
  // access â either it had no email on file yet (now added via update()),
  // or the Tenant Dashboard was unreachable at approval time. See
  // "Provisioning is decoupled from approval succeeding" in ARCHITECTURE.md.
  async provisionDashboard(id: string) {
    const tenant = await this.findOne(id);
    if (tenant.dashboardUserEmail) {
      throw new ConflictException('This tenant already has dashboard access');
    }
    if (!tenant.email) {
      throw new BadRequestException('Add an email for this tenant before provisioning dashboard access');
    }

    const outcome = await this.tenantDashboardClient.provisionTenant(tenant);
    if (!outcome.ok) {
      throw new BadRequestException(outcome.reason);
    }
    const provisioning = outcome.result;

    await this.prisma.tenant.update({ where: { id }, data: { dashboardUserEmail: provisioning.email } });

    await this.mail.sendTenantCredentials({
      to: provisioning.email,
      tenantName: tenant.name,
      loginEmail: provisioning.email,
      temporaryPassword: provisioning.temporaryPassword,
    });

    return { email: provisioning.email, temporaryPassword: provisioning.temporaryPassword };
  }
}
