import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters').max(80),
  code: z
    .string()
    .trim()
    .min(2, 'Department code must be at least 2 characters')
    .max(20)
    .transform((v) => v.toUpperCase()),
  description: z.string().trim().max(500).optional().nullable(),
  headId: z.string().uuid('Invalid headId UUID').optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .transform((v) => v.toUpperCase())
    .optional(),
  description: z.string().trim().max(500).optional().nullable(),
  headId: z.string().uuid('Invalid headId UUID').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listDepartmentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
export type ListDepartmentsQueryDto = z.infer<typeof listDepartmentsQuerySchema>;
