import { PrismaClient, UserRole, EmployeeDesignation } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// ─── Seed users: one per role + 4 employee designations ──────────────────────
const SEED_USERS: Array<{
  email: string;
  name: string;
  password: string;
  role: UserRole;
  designation?: EmployeeDesignation;
  department?: string;
}> = [
  {
    email: 'superadmin@hrm.dev',
    name: 'Super Admin',
    password: 'Password123',
    role: UserRole.SUPER_ADMIN,
    department: 'Platform',
  },
  {
    email: 'admin@hrm.dev',
    name: 'Admin User',
    password: 'Password123',
    role: UserRole.ADMIN,
    department: 'Administration',
  },
  {
    email: 'hr.manager@hrm.dev',
    name: 'HR Manager',
    password: 'Password123',
    role: UserRole.HR_MANAGER,
    department: 'Human Resources',
  },
  {
    email: 'hr.executive@hrm.dev',
    name: 'HR Executive',
    password: 'Password123',
    role: UserRole.HR_EXECUTIVE,
    department: 'Human Resources',
  },
  {
    email: 'recruiter@hrm.dev',
    name: 'Recruiter',
    password: 'Password123',
    role: UserRole.RECRUITER,
    department: 'Human Resources',
  },
  {
    email: 'finance.manager@hrm.dev',
    name: 'Finance Manager',
    password: 'Password123',
    role: UserRole.FINANCE_MANAGER,
    department: 'Finance',
  },
  {
    email: 'finance.exec@hrm.dev',
    name: 'Finance Executive',
    password: 'Password123',
    role: UserRole.FINANCE_EXECUTIVE,
    department: 'Finance',
  },
  {
    email: 'manager@hrm.dev',
    name: 'Team Manager',
    password: 'Password123',
    role: UserRole.MANAGER,
    department: 'Engineering',
  },
  {
    email: 'teamlead@hrm.dev',
    name: 'Team Lead',
    password: 'Password123',
    role: UserRole.TEAM_LEAD,
    department: 'Engineering',
  },
  // ── EMPLOYEE: 4 designations ──
  {
    email: 'senior@hrm.dev',
    name: 'Senior Employee',
    password: 'Password123',
    role: UserRole.EMPLOYEE,
    designation: EmployeeDesignation.SENIOR,
    department: 'Engineering',
  },
  {
    email: 'junior@hrm.dev',
    name: 'Junior Employee',
    password: 'Password123',
    role: UserRole.EMPLOYEE,
    designation: EmployeeDesignation.JUNIOR,
    department: 'Engineering',
  },
  {
    email: 'associate@hrm.dev',
    name: 'Associate Employee',
    password: 'Password123',
    role: UserRole.EMPLOYEE,
    designation: EmployeeDesignation.ASSOCIATE,
    department: 'Engineering',
  },
  {
    email: 'trainee@hrm.dev',
    name: 'Trainee Employee',
    password: 'Password123',
    role: UserRole.EMPLOYEE,
    designation: EmployeeDesignation.TRAINEE,
    department: 'Engineering',
  },
];

async function main() {
  console.log('[Seed] Seeding HRM users...\n');

  for (const seed of SEED_USERS) {
    const passwordHash = await bcrypt.hash(seed.password, SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        passwordHash,
        role: seed.role,
        designation: seed.designation ?? null,
        department: seed.department ?? null,
        failedAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: seed.email,
        name: seed.name,
        passwordHash,
        role: seed.role,
        designation: seed.designation ?? null,
        department: seed.department ?? null,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    const label = seed.designation
      ? `${seed.role} / ${seed.designation}`
      : seed.role;
    console.log(`  ✓ ${seed.email.padEnd(30)} [${label}]  pw: ${seed.password}`);
  }

  console.log('\n[Seed] Done! All HRM seed users created/updated.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

