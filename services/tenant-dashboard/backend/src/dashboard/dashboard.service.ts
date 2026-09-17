import { Injectable } from '@nestjs/common';
import { TenantPrismaFactory } from '../tenant-db/tenant-prisma.factory.js';
import { RfqsService } from '../rfqs/rfqs.service.js';

// SRS Â§7. One call, four counts + a recent-RFQ preview â kept together so
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

    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // UTC-normalized "today" so the trend window and its day buckets line up
    // with `createdAt.toISOString().slice(0, 10)` regardless of server TZ.
    const todayUtcStart = new Date();
    todayUtcStart.setUTCHours(0, 0, 0, 0);
    const trendStart = new Date(todayUtcStart);
    trendStart.setUTCDate(trendStart.getUTCDate() - 29); // 29 days ago + today = 30 days

    const [
      totalProducts,
      activeProducts,
      newRfqs,
      respondedThisMonth,
      recentRfqs,
      totalRfqs,
      declinedRfqs,
      expiredRfqs,
      expiringSoon,
      trendRows,
    ] = await Promise.all([
      client.product.count(),
      client.product.count({ where: { isActive: true } }),
      client.rfq.count({ where: { status: 'NEW' } }),
      client.rfqResponse.count({ where: { respondedAt: { gte: startOfMonth } } }),
      client.rfq.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      client.rfq.count(),
      client.rfq.count({ where: { status: 'DECLINED' } }),
      client.rfq.count({ where: { status: 'EXPIRED' } }),
      client.rfq.count({ where: { status: 'NEW', deadlineAt: { gte: now, lte: in48h } } }),
      client.rfq.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    ]);

    // Bucket into day counts first, then walk the 30-day window day-by-day
    // so every day appears in rfqTrend, even ones with zero RFQs.
    const countsByDay = new Map<string, number>();
    for (const { createdAt } of trendRows) {
      const key = createdAt.toISOString().slice(0, 10);
      countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
    }

    const rfqTrend: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(todayUtcStart);
      day.setUTCDate(day.getUTCDate() - i);
      const key = day.toISOString().slice(0, 10);
      rfqTrend.push({ date: key, count: countsByDay.get(key) ?? 0 });
    }

    return {
      totalProducts,
      activeProducts,
      newRfqs,
      respondedThisMonth,
      recentRfqs,
      totalRfqs,
      declinedRfqs,
      expiredRfqs,
      expiringSoon,
      rfqTrend,
    };
  }
}
