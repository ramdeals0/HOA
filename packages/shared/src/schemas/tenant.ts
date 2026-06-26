import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  timezone: z.string().default('America/Chicago'),
  locale: z.string().default('en-US'),
  address: z.string().optional(),
  state: z.string().optional(),
  primaryContactEmail: z.string().email(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminFirstName: z.string().min(1),
  adminLastName: z.string().min(1),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  primaryContactEmail: z.string().email().optional(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().optional(),
  monthlyDuesCents: z.number().int().positive().optional(),
  annualDuesCents: z.number().int().positive().optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
