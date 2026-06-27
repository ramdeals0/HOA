import { z } from 'zod';

export const resolutionTypeSchema = z.enum(['RESOLUTION', 'VIEWPOINT']);
export const resolutionStatusSchema = z.enum(['DRAFT', 'OPEN', 'CLOSED']);

export const resolutionOptionSchema = z.object({
  label: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0).optional(),
});

export const createResolutionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  type: resolutionTypeSchema.default('RESOLUTION'),
  options: z.array(resolutionOptionSchema).min(2).max(10),
  opensAt: z.string().datetime().optional(),
  closesAt: z.string().datetime().optional(),
});

export const updateResolutionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  type: resolutionTypeSchema.optional(),
  opensAt: z.string().datetime().nullable().optional(),
  closesAt: z.string().datetime().nullable().optional(),
  options: z.array(resolutionOptionSchema).min(2).max(10).optional(),
});

export const castVoteSchema = z.object({
  optionId: z.string().uuid(),
});

export const resolutionQuerySchema = z.object({
  status: resolutionStatusSchema.optional(),
  type: resolutionTypeSchema.optional(),
});

export type ResolutionType = z.infer<typeof resolutionTypeSchema>;
export type ResolutionStatus = z.infer<typeof resolutionStatusSchema>;
export type CreateResolutionInput = z.infer<typeof createResolutionSchema>;
export type UpdateResolutionInput = z.infer<typeof updateResolutionSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
