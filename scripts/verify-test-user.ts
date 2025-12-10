import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.updateMany({
    where: {
      email: 'test@contracts.com',
    },
    data: {
      verified: true,
      verifiedAt: new Date(),
      emailVerified: true,
      documentNumber: '12345678',
      fullName: 'Test User',
    },
  });

  console.log(`Updated ${user.count} user(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

