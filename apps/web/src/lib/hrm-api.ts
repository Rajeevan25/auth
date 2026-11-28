import { apiClient } from './api';
import type {
  User,
  Department,
  Designation,
  UserProfile,
  PaginatedResponse,
  RoleMeta,
  UserRole,
} from '../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const changePassword = (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => apiClient.post<{ success: boolean; message: string }>('/auth/change-password', data);

// ─── Users / Me ───────────────────────────────────────────────────────────────
export const getMyProfile = () =>
  apiClient.get<{ success: boolean; user: User }>('/users/me/profile');

export const updateMyProfile = (data: Partial<UserProfile> & { name?: string }) =>
  apiClient.patch<{ success: boolean; user: User }>('/users/me/profile', data);

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  departmentId?: string;
  designationId?: string;
  isActive?: boolean;
}

export const getUsers = (params?: ListUsersParams) =>
  apiClient.get<{ success: boolean } & PaginatedResponse<User>>('/users', { params });

export const getUserById = (id: string) =>
  apiClient.get<{ success: boolean; user: User }>(`/users/${id}`);

export const createUser = (data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId?: string | null;
  designationId?: string | null;
  managerId?: string | null;
  profile?: Partial<UserProfile>;
}) => apiClient.post<{ success: boolean; user: User }>('/users', data);

export const updateUser = (
  id: string,
  data: { name?: string; email?: string; profile?: Partial<UserProfile> },
) => apiClient.patch<{ success: boolean; user: User }>(`/users/${id}`, data);

export const updateUserOrg = (
  id: string,
  data: {
    role?: UserRole;
    departmentId?: string | null;
    designationId?: string | null;
    managerId?: string | null;
  },
) => apiClient.patch<{ success: boolean; user: User }>(`/users/${id}/org`, data);

export const updateUserStatus = (
  id: string,
  data: { isActive?: boolean; unlockAccount?: boolean },
) => apiClient.patch<{ success: boolean; user: User }>(`/users/${id}/status`, data);

// ─── Departments ──────────────────────────────────────────────────────────────
export const getDepartments = (params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) =>
  apiClient.get<{ success: boolean; departments: Department[]; meta: PaginatedResponse<Department>['meta'] }>(
    '/departments',
    { params },
  );

export const getDepartmentById = (id: string) =>
  apiClient.get<{ success: boolean; department: Department }>(`/departments/${id}`);

export const createDepartment = (data: {
  name: string;
  code: string;
  description?: string;
  headId?: string | null;
}) => apiClient.post<{ success: boolean; department: Department }>('/departments', data);

export const updateDepartment = (
  id: string,
  data: { name?: string; code?: string; description?: string; headId?: string | null; isActive?: boolean },
) => apiClient.patch<{ success: boolean; department: Department }>(`/departments/${id}`, data);

export const deactivateDepartment = (id: string) =>
  apiClient.delete<{ success: boolean; message: string }>(`/departments/${id}`);

// ─── Designations ─────────────────────────────────────────────────────────────
export const getDesignations = (params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) =>
  apiClient.get<{ success: boolean; designations: Designation[]; meta: PaginatedResponse<Designation>['meta'] }>(
    '/designations',
    { params },
  );

export const createDesignation = (data: {
  name: string;
  code: string;
  level: number;
  leaveQuota: number;
  description?: string;
}) => apiClient.post<{ success: boolean; designation: Designation }>('/designations', data);

export const updateDesignation = (
  id: string,
  data: { name?: string; code?: string; level?: number; leaveQuota?: number; description?: string; isActive?: boolean },
) => apiClient.patch<{ success: boolean; designation: Designation }>(`/designations/${id}`, data);

export const deactivateDesignation = (id: string) =>
  apiClient.delete<{ success: boolean; message: string }>(`/designations/${id}`);

// ─── Roles ────────────────────────────────────────────────────────────────────
export const getRoles = () =>
  apiClient.get<{ success: boolean; roles: RoleMeta[] }>('/roles');

export const getAssignableRoles = () =>
  apiClient.get<{ success: boolean; roles: RoleMeta[] }>('/roles/assignable');
