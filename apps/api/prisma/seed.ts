import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@example.com';
  const rawPassword = 'Password123';
  const name = 'Demo User';

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log(`[Seed] Created demo user: ${user.email} (Password: ${rawPassword})`);
  } else {
    // Update password hash to ensure credentials match
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log(`[Seed] Demo user already exists, updated credentials: ${email} (Password: ${rawPassword})`);
  }
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

