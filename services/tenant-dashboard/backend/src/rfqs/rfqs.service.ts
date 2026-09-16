import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaFactory } from '../tenant-db/tenant-prisma.factory.js';
import { PrismaControlService } from '../prisma-control/prisma-control.service.js';
import type { Prisma } from '../../generated/tenant/index.js';
import { RespondRfqDto } from './dto/respond-rfq.dto.js';
import { DeclineRfqDto } from './dto/decline-rfq.dto.js';
import { SeedTestRfqDto } from './dto/seed-test-rfq.dto.js';
import { ListRfqsQueryDto } from './dto/list-rfqs-query.dto.js';

@Injectable()
export class RfqsService {
  constructor(
    private readonly tenantPrisma: TenantPrismaFactory,
    private readonly control: PrismaControlService,
  ) {}

  // SRS §14: expiry is computed lazily (on read) rather than by a
  // scheduled job in this version — flips any NEW row whose deadline has
  // passed to EXPIRED right before it's returned, so status is always
  // accurate without a cron/worker process running alongside this service.
  // Public so DashboardService can call it too before counting "New RFQs"
  // (SRS §18: the nav badge / dashboard count must agree with the inbox).
  async expirePastDeadlines(dbName: string) {
    await this.tenantPrisma.forDatabase(dbName).rfq.updateMany({
      where: { status: 'NEW', deadlineAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
  }

  async findAll(dbName: string, query: ListRfqsQueryDto) {
    await this.expirePastDeadlines(dbName);
    const client = this.tenantPrisma.forDatabase(dbName);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.RfqWhereInput = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      client.rfq.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      client.rfq.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(dbName: string, id: string) {
    await this.expirePastDeadlines(dbName);
    const rfq = await this.tenantPrisma.forDatabase(dbName).rfq.findUnique({
      where: { id },
      include: { response: { include: { product: true } } },
    });
    if (!rfq) throw new NotFoundException('Request not found');
    return rfq;
  }

  // SRS §13/§14: only a NEW request may be responded to. The app-level
  // status check below closes the common case (stale UI); the DB-level
  // unique constraint on RfqResponse.rfqId is the real guard against a
  // genuine race (two concurrent submits) — caught as P2002 below and
  // turned into the same 409 a stale-UI submit gets.
  async respond(dbName: string, id: string, dto: RespondRfqDto) {
    await this.expirePastDeadlines(dbName);
    const client = this.tenantPrisma.forDatabase(dbName);

    const rfq = await client.rfq.findUnique({ where: { id } });
    if (!rfq) throw new NotFoundException('Request not found');
    if (rfq.status !== 'NEW') {
      throw new ConflictException(
        `This request is already ${rfq.status.toLowerCase()} and can no longer be responded to.`,
      );
    }

    if (dto.productId) {
      const product = await client.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new BadRequestException('Selected product does not exist');
    }

    try {
      await client.$transaction([
        client.rfqResponse.create({
          data: {
            rfqId: id,
            productId: dto.productId,
            price: dto.price,
            priceUnit: dto.priceUnit,
            availabilityNote: dto.availabilityNote,
            message: dto.message,
          },
        }),
        client.rfq.update({ where: { id }, data: { status: 'RESPONDED' } }),
      ]);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('This request has already been responded to.');
      }
      throw error;
    }

    return this.findOne(dbName, id);
  }

  async decline(dbName: string, id: string, dto: DeclineRfqDto) {
    await this.expirePastDeadlines(dbName);
    const client = this.tenantPrisma.forDatabase(dbName);

    const rfq = await client.rfq.findUnique({ where: { id } });
    if (!rfq) throw new NotFoundException('Request not found');
    if (rfq.status !== 'NEW') {
      throw new ConflictException(
        `This request is already ${rfq.status.toLowerCase()} and can no longer be declined.`,
      );
    }

    await client.rfq.update({
      where: { id },
      data: { status: 'DECLINED', declineReason: dto.reason, declinedAt: new Date() },
    });

    return this.findOne(dbName, id);
  }

  // Internal-only: SRS §14's seed path, called from Super Admin's backend
  // until the Public Website exists to originate real RFQs.
  async seedTest(dto: SeedTestRfqDto) {
    const account = await this.control.tenantAccount.findUnique({ where: { id: dto.tenantId } });
    if (!account) throw new NotFoundException(`Tenant ${dto.tenantId} is not provisioned`);

    return this.tenantPrisma.forDatabase(account.dbName).rfq.create({
      data: {
        buyerName: dto.buyerName,
        buyerPhone: dto.buyerPhone,
        category: dto.category,
        description: dto.description,
        quantity: dto.quantity,
        deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : undefined,
        isTest: true,
      },
    });
  }
}
