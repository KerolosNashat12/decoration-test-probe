import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaFactory } from '../tenant-db/tenant-prisma.factory.js';
import type { Prisma } from '../../generated/tenant/index.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ListProductsQueryDto } from './dto/list-products-query.dto.js';

@Injectable()
export class CatalogService {
  constructor(private readonly tenantPrisma: TenantPrismaFactory) {}

  // SRS §9: search (name, case-insensitive) + category filter + status
  // filter, all combinable, server-side pagination (20/page by default).
  async findAll(dbName: string, query: ListProductsQueryDto) {
    const client = this.tenantPrisma.forDatabase(dbName);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ProductWhereInput = {
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };

    const [items, total] = await Promise.all([
      client.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      client.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(dbName: string, id: string) {
    const product = await this.tenantPrisma.forDatabase(dbName).product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dbName: string, dto: CreateProductDto) {
    return this.tenantPrisma.forDatabase(dbName).product.create({ data: dto });
  }

  async update(dbName: string, id: string, dto: UpdateProductDto) {
    await this.findOne(dbName, id);
    return this.tenantPrisma.forDatabase(dbName).product.update({ where: { id }, data: dto });
  }

  // SRS §11: hard delete is blocked if any RfqResponse already references
  // this product — deleting it would corrupt the historical record of what
  // was quoted. Deactivating (PATCH isActive: false) is always the
  // reversible alternative, handled by `update` above like any other field.
  async remove(dbName: string, id: string) {
    await this.findOne(dbName, id);
    const client = this.tenantPrisma.forDatabase(dbName);

    const referencedByResponse = await client.rfqResponse.findFirst({ where: { productId: id } });
    if (referencedByResponse) {
      throw new ConflictException(
        'This product has already been quoted in an RFQ response — deactivate it instead of deleting it.',
      );
    }

    await client.product.delete({ where: { id } });
    return { deleted: true };
  }
}
