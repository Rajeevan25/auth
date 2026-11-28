// ─── Role ─────────────────────────────────────────────────────────────────────
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'HR_MANAGER'
  | 'HR_EXECUTIVE'
  | 'RECRUITER'
  | 'FINANCE_MANAGER'
  | 'FINANCE_EXECUTIVE'
  | 'MANAGER'
  | 'TEAM_LEAD'
  | 'EMPLOYEE';

// ─── Org entities ─────────────────────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  headId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  head?: { id: string; name: string; email: string } | null;
  _count?: { users: number };
}

export interface Designation {
  id: string;
  name: string;
  code: string;
  level: number;
  leaveQuota: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number };
}

// ─── User / Profile ───────────────────────────────────────────────────────────
export interface UserProfile {
  id?: string;
  userId?: string;
  employeeCode?: string | null;
  phone?: string | null;
  personalEmail?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  maritalStatus?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  joiningDate?: string | null;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | null;
  workLocation?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  designation?: { id: string; code: string; name: string; leaveQuota: number } | null;
  department?: { id: string; code: string; name: string } | null;
  manager?: { id: string; name: string; email: string } | null;
  isActive: boolean;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil?: string | null;
  createdAt: string;
  updatedAt?: string;
  profile?: UserProfile | null;
  _count?: { directReports: number };
  managerId?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
}

// ─── API Response shapes ───────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data?: T[];
  users?: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RoleMeta {
  code: UserRole;
  label: string;
  level: number;
  description: string;
  userCount?: number;
}
