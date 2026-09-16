// Creates the first Super Admin login. Run once after the first migration:
//   npx prisma db seed
// Change ADMIN_EMAIL / ADMIN_PASSWORD via env vars before running in
// anything other than local dev — this seed is meant for bootstrapping.
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@decoration.local';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Super Admin',
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`Seeded admin user: ${admin.email} (change the password after first login)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
