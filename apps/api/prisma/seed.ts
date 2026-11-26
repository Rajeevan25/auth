import { PrismaClient, UserRole, EmploymentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const SEED_DEPARTMENTS = [
  { name: 'Platform', code: 'PLAT', description: 'Platform & Infrastructure' },
  { name: 'Administration', code: 'ADMIN', description: 'General Administration' },
  { name: 'Human Resources', code: 'HR', description: 'People Operations & Talent' },
  { name: 'Finance', code: 'FIN', description: 'Finance & Payroll' },
  { name: 'Engineering', code: 'ENG', description: 'Software Engineering' },
];

const SEED_DESIGNATIONS = [
  { name: 'Senior', code: 'SENIOR', level: 4, leaveQuota: 24, description: '5+ years experience' },
  { name: 'Junior', code: 'JUNIOR', level: 2, leaveQuota: 18, description: '1-4 years experience' },
  { name: 'Associate', code: 'ASSOCIATE', level: 1, leaveQuota: 15, description: '0-1 year (fresher)' },
  { name: 'Trainee', code: 'TRAINEE', level: 0, leaveQuota: 6, description: 'Intern / probation' },
];

const SEED_USERS: Array<{
  employeeCode: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  designationCode?: string;
  departmentCode: string;
  employmentType?: EmploymentType;
  managerEmail?: string;
}> = [
  {
    employeeCode: 'EMP-001',
    email: 'superadmin@hrm.dev',
    name: 'Super Admin',
    password: 'Password123',
    role: UserRole.SUPER_ADMIN,
    departmentCode: 'PLAT',
  },
  {
    employeeCode: 'EMP-002',
    email: 'admin@hrm.dev',
    name: 'Admin User',
    password: 'Password123',
    role: UserRole.ADMIN,
    departmentCode: 'ADMIN',
  },
  {
    employeeCode: 'EMP-003',
    email: 'hr.manager@hrm.dev',
    name: 'HR Manager',
    password: 'Password123',
    role: UserRole.HR_MANAGER,
    departmentCode: 'HR',
  },
  {
    employeeCode: 'EMP-004',
    email: 'hr.executive@hrm.dev',
    name: 'HR Executive',
    password: 'Password123',
    role: UserRole.HR_EXECUTIVE,
    departmentCode: 'HR',
    managerEmail: 'hr.manager@hrm.dev',
  },
  {
    employeeCode: 'EMP-005',
    email: 'recruiter@hrm.dev',
    name: 'Recruiter',
    password: 'Password123',
    role: UserRole.RECRUITER,
    departmentCode: 'HR',
    managerEmail: 'hr.manager@hrm.dev',
  },
  {
    employeeCode: 'EMP-006',
    email: 'finance.manager@hrm.dev',
    name: 'Finance Manager',
    password: 'Password123',
    role: UserRole.FINANCE_MANAGER,
    departmentCode: 'FIN',
  },
  {
    employeeCode: 'EMP-007',
    email: 'finance.exec@hrm.dev',
    name: 'Finance Executive',
    password: 'Password123',
    role: UserRole.FINANCE_EXECUTIVE,
    departmentCode: 'FIN',
    managerEmail: 'finance.manager@hrm.dev',
  },
  {
    employeeCode: 'EMP-008',
    email: 'manager@hrm.dev',
    name: 'Team Manager',
    password: 'Password123',
    role: UserRole.MANAGER,
    departmentCode: 'ENG',
  },
  {
    employeeCode: 'EMP-009',
    email: 'teamlead@hrm.dev',
    name: 'Team Lead',
    password: 'Password123',
    role: UserRole.TEAM_LEAD,
    departmentCode: 'ENG',
    managerEmail: 'manager@hrm.dev',
  },
  {
    employeeCode: 'EMP-010',
    email: 'senior@hrm.dev',
    name: 'Senior Employee',
    password: 'Password123',
    role: UserRole.EMPLOYEE,
    designationCode: 'SENIOR',
    departmentCode: 'ENG',
    managerEmail: 'teamlead@hrm.dev',
  },
  {
    employeeCode: 'EMP-011',
    email: 'junior@hrm.dev',
    name: 'Junior Employee',
    password: 'Password123',
    role: UserRole.EMPLOYEE,
    designationCode: 'JUNIOR',
    departmentCode: 'ENG',
    managerEmail: 'teamlead@hrm.dev',
  },
  {
    employeeCode: 'EMP-012',
    email: 'associate@hrm.dev',
    name: 'Associate Employee',
    password: 'Password123',
    role: UserRole.EMPLOYEE,
    designationCode: 'ASSOCIATE',
    departmentCode: 'ENG',
    managerEmail: 'teamlead@hrm.dev',
  },
  {
    employeeCode: 'EMP-013',
    email: 'trainee@hrm.dev',
    name: 'Trainee Employee',
    password: 'Password123',
    role: UserRole.EMPLOYEE,
    designationCode: 'TRAINEE',
    departmentCode: 'ENG',
    employmentType: EmploymentType.INTERN,
    managerEmail: 'teamlead@hrm.dev',
  },
];

async function main() {
  console.log('[Seed] Seeding departments...');
  const departmentByCode = new Map<string, string>();
  for (const dept of SEED_DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description, isActive: true },
      create: dept,
    });
    departmentByCode.set(dept.code, record.id);
  }

  console.log('[Seed] Seeding designations...');
  const designationByCode = new Map<string, string>();
  for (const desig of SEED_DESIGNATIONS) {
    const record = await prisma.designation.upsert({
      where: { code: desig.code },
      update: {
        name: desig.name,
        level: desig.level,
        leaveQuota: desig.leaveQuota,
        description: desig.description,
        isActive: true,
      },
      create: desig,
    });
    designationByCode.set(desig.code, record.id);
  }

  console.log('[Seed] Seeding HRM users & profiles...\n');
  const userIdByEmail = new Map<string, string>();

  for (const seed of SEED_USERS) {
    const passwordHash = await bcrypt.hash(seed.password, SALT_ROUNDS);
    const departmentId = departmentByCode.get(seed.departmentCode) ?? null;
    const designationId = seed.designationCode
      ? (designationByCode.get(seed.designationCode) ?? null)
      : null;

    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        passwordHash,
        role: seed.role,
        designationId,
        departmentId,
        failedAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: seed.email,
        name: seed.name,
        passwordHash,
        role: seed.role,
        designationId,
        departmentId,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    userIdByEmail.set(seed.email, user.id);

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        employeeCode: seed.employeeCode,
        employmentType: seed.employmentType ?? EmploymentType.FULL_TIME,
      },
      create: {
        userId: user.id,
        employeeCode: seed.employeeCode,
        employmentType: seed.employmentType ?? EmploymentType.FULL_TIME,
        joiningDate: new Date('2025-01-01T00:00:00.000Z'),
        workLocation: 'HQ',
      },
    });

    const label = seed.designationCode
      ? `${seed.role} / ${seed.designationCode}`
      : seed.role;
    console.log(`  ✓ ${seed.email.padEnd(30)} [${label}]  pw: ${seed.password}`);
  }

  // Link managers and department heads after all users exist
  for (const seed of SEED_USERS) {
    if (seed.managerEmail) {
      const userId = userIdByEmail.get(seed.email);
      const managerId = userIdByEmail.get(seed.managerEmail);
      if (userId && managerId) {
        await prisma.user.update({
          where: { id: userId },
          data: { managerId },
        });
      }
    }
  }

  const departmentHeads: Array<{ code: string; email: string }> = [
    { code: 'HR', email: 'hr.manager@hrm.dev' },
    { code: 'FIN', email: 'finance.manager@hrm.dev' },
    { code: 'ENG', email: 'manager@hrm.dev' },
  ];

  for (const head of departmentHeads) {
    const deptId = departmentByCode.get(head.code);
    const headId = userIdByEmail.get(head.email);
    if (deptId && headId) {
      await prisma.department.update({
        where: { id: deptId },
        data: { headId },
      });
    }
  }

  console.log('\n[Seed] Done! Departments, designations, users, and profiles seeded.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
