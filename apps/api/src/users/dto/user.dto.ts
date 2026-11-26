import { EmploymentType, Gender, UserRole } from '@prisma/client';
import { z } from 'zod';

const optionalDateSchema = z
  .union([z.string().datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .transform((val) => new Date(val))
  .optional()
  .nullable();

export const userProfileSchema = z.object({
  employeeCode: z.string().trim().min(2).max(30).optional().nullable(),
  phone: z.string().trim().min(5).max(30).optional().nullable(),
  personalEmail: z.string().trim().email('Invalid personal email').optional().nullable(),
  avatarUrl: z.string().trim().url('Invalid avatar URL').optional().nullable(),
  dateOfBirth: optionalDateSchema,
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  joiningDate: optionalDateSchema,
  employmentType: z.nativeEnum(EmploymentType).optional().nullable(),
  workLocation: z.string().trim().max(100).optional().nullable(),
  emergencyContactName: z.string().trim().max(100).optional().nullable(),
  emergencyContactPhone: z.string().trim().max(30).optional().nullable(),
  emergencyContactRelation: z.string().trim().max(50).optional().nullable(),
});

export const createUserSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),
  departmentId: z.string().uuid('Invalid departmentId').optional().nullable(),
  designationId: z.string().uuid('Invalid designationId').optional().nullable(),
  managerId: z.string().uuid('Invalid managerId').optional().nullable(),
  profile: userProfileSchema.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  profile: userProfileSchema.optional(),
});

export const updateUserOrgSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  departmentId: z.string().uuid('Invalid departmentId').optional().nullable(),
  designationId: z.string().uuid('Invalid designationId').optional().nullable(),
  managerId: z.string().uuid('Invalid managerId').optional().nullable(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),
  unlockAccount: z.boolean().optional(),
});

export const updateMyProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(5).max(30).optional().nullable(),
  personalEmail: z.string().trim().email('Invalid personal email').optional().nullable(),
  avatarUrl: z.string().trim().url('Invalid avatar URL').optional().nullable(),
  dateOfBirth: optionalDateSchema,
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  emergencyContactName: z.string().trim().max(100).optional().nullable(),
  emergencyContactPhone: z.string().trim().max(30).optional().nullable(),
  emergencyContactRelation: z.string().trim().max(50).optional().nullable(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateUserOrgDto = z.infer<typeof updateUserOrgSchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export type UpdateMyProfileDto = z.infer<typeof updateMyProfileSchema>;
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
