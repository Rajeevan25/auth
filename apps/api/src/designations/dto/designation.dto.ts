import { z } from 'zod';

export const createDesignationSchema = z.object({
  name: z.string().trim().min(2, 'Designation name must be at least 2 characters').max(80),
  code: z
    .string()
    .trim()
    .min(2, 'Designation code must be at least 2 characters')
    .max(20)
    .transform((v) => v.toUpperCase()),
  level: z.number().int().min(0).max(20).default(1),
  leaveQuota: z.number().int().min(0).max(365).default(18),
  description: z.string().trim().max(500).optional().nullable(),
});

export const updateDesignationSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .transform((v) => v.toUpperCase())
    .optional(),
  level: z.number().int().min(0).max(20).optional(),
  leaveQuota: z.number().int().min(0).max(365).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listDesignationsQuerySchema = z.object({
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type CreateDesignationDto = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationDto = z.infer<typeof updateDesignationSchema>;
export type ListDesignationsQueryDto = z.infer<typeof listDesignationsQuerySchema>;
