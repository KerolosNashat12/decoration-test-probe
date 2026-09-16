import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.seedFirstAdminIfEmpty();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // First-run bootstrap: if this database has no admin users yet (a brand
  // new deploy, e.g. on Vercel — where nothing can run `prisma db seed`
  // for us against the live database), create the first Super Admin login
  // automatically. Safe to run on every boot: it's a no-op once any admin
  // exists. Mirrors prisma/seed.ts, used for local dev.
  private async seedFirstAdminIfEmpty() {
    const existingAdminCount = await this.adminUser.count();
    if (existingAdminCount > 0) return;

    const email = process.env.ADMIN_EMAIL ?? 'admin@decoration.local';
    const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      // upsert, not create: two serverless cold starts can race this at
      // once (both see count === 0), and the email is unique — upsert
      // makes the loser a no-op instead of a crash.
      await this.adminUser.upsert({
        where: { email },
        update: {},
        create: { name: 'Super Admin', email, passwordHash, role: 'SUPER_ADMIN' },
      });
      this.logger.warn(
        `No admin users found — seeded the first Super Admin login (${email}). Change this password after first sign-in.`,
      );
    } catch (error) {
      // Lost the race to another concurrent cold start — fine, it seeded.
      this.logger.debug(`Skipped first-admin seed: ${(error as Error).message}`);
    }
  }
}
