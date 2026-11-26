-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE', 'RECRUITER', 'FINANCE_MANAGER', 'FINANCE_EXECUTIVE', 'MANAGER', 'TEAM_LEAD', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "EmployeeDesignation" AS ENUM ('SENIOR', 'JUNIOR', 'ASSOCIATE', 'TRAINEE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation" "EmployeeDesignation",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE';
