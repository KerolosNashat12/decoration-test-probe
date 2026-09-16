import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalTenants,
      approvedTenants,
      suspendedTenants,
      pendingApplications,
      approvedThisMonth,
      rejectedApplications,
      recentApplications,
    ] = await this.prisma.$transaction([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'APPROVED' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.tenantApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.tenantApplication.count({
        where: { status: 'APPROVED', reviewedAt: { gte: startOfMonth } },
      }),
      this.prisma.tenantApplication.count({ where: { status: 'REJECTED' } }),
      this.prisma.tenantApplication.findMany({
        take: 5,
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    // Grouped so the frontend can render categories as a simple bar/list
    // without a second round trip.
    const tenantsByCategory = await this.prisma.tenant.findMany({
      where: { status: 'APPROVED' },
      select: { categories: true },
    });
    const categoryCounts: Record<string, number> = {};
    for (const t of tenantsByCategory) {
      for (const c of t.categories) {
        categoryCounts[c] = (categoryCounts[c] ?? 0) + 1;
      }
    }

    return {
      totalTenants,
      approvedTenants,
      suspendedTenants,
      pendingApplications,
      approvedThisMonth,
      rejectedApplications,
      categoryCounts,
      recentApplications,
    };
  }
}
