import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';

@Injectable()
export class TenantApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
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
