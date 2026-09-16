import { Injectable } from '@nestjs/common';
import { TenantPrismaFactory } from '../tenant-db/tenant-prisma.factory.js';
import { RfqsService } from '../rfqs/rfqs.service.js';

// SRS §7. One call, four counts + a recent-RFQ preview — kept together so
// the Dashboard overview loads in a single round trip.
@Injectable()
export class DashboardService {
  constructor(
    private readonly tenantPrisma: TenantPrismaFactory,
    private readonly rfqs: RfqsService,
  ) {}

  async summary(dbName: string) {
    await this.rfqs.expirePastDeadlines(dbName);
    const client = this.tenantPrisma.forDatabase(dbName);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalProducts, activeProducts, newRfqs, respondedThisMonth, recentRfqs] = await Promise.all([
      client.product.count(),
      client.product.count({ where: { isActive: true } }),
      client.rfq.count({ where: { status: 'NEW' } }),
      client.rfqResponse.count({ where: { respondedAt: { gte: startOfMonth } } }),
      client.rfq.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return { totalProducts, activeProducts, newRfqs, respondedThisMonth, recentRfqs };
  }
}
