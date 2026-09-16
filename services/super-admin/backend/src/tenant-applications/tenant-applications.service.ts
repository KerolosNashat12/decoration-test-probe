import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantDashboardClientService } from '../tenant-dashboard/tenant-dashboard-client.service.js';
import { MailService } from '../mail/mail.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';

@Injectable()
export class TenantApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantDashboardClient: TenantDashboardClientService,
    private readonly mail: MailService,
  ) {}

  // Public: a supplier requests to join from the website.
  submit(dto: CreateApplicationDto) {
    return this.prisma.tenantApplication.create({ data: dto });
  }

  // Admin: the review queue.
  findAll(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.tenantApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const application = await this.prisma.tenantApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException(`Application ${id} not found`);
    return application;
  }

  // Approve = create the Tenant record and link it back to the application,
  // in one transaction so we never end up with an approved application and
  // no tenant (or vice versa).
  async approve(id: string, reviewerId: string) {
    const application = await this.findOne(id);

    const { application: updatedApplication, tenant } = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: application.shopName,
          contactName: application.contactName,
          phone: application.phone,
          whatsapp: application.whatsapp,
          email: application.email,
          district: application.district,
          categories: application.categories,
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
        },
      });

      const updatedApplication = await tx.tenantApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          tenantId: tenant.id,
        },
      });

      return { application: updatedApplication, tenant };
    });

    // Provisioning is a call to a different service, over the network —
    // deliberately outside the transaction above. If it fails or the
    // tenant has no email on file, the tenant is still approved; the
    // Tenants page offers a "Provision dashboard access" retry for it (see
    // TenantsService.provisionDashboard). See ARCHITECTURE.md.
    const provisioning = await this.tenantDashboardClient.provisionTenant(tenant);
    if (provisioning) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { dashboardUserEmail: provisioning.email },
      });

      // Awaited (not fire-and-forget) because this runs as a Vercel
      // serverless function in production — an un-awaited promise can be
      // frozen mid-flight once the response is sent, so the email would
      // never actually go out. sendTenantCredentials never throws and
      // never blocks the approval on a *failed* send, only on the (fast)
      // attempt itself; the admin still sees the one-time password in the
      // UI either way, so this can't make approval fail.
      await this.mail.sendTenantCredentials({
        to: provisioning.email,
        tenantName: tenant.name,
        loginEmail: provisioning.email,
        temporaryPassword: provisioning.temporaryPassword,
      });
    }

    return {
      application: updatedApplication,
      tenant,
      provisioning: provisioning
        ? { email: provisioning.email, temporaryPassword: provisioning.temporaryPassword }
        : null,
    };
  }

  async reject(id: string, reviewerId: string, reason?: string) {
    await this.findOne(id);
    return this.prisma.tenantApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        rejectionReason: reason,
      },
    });
  }
}
