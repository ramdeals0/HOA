import { z } from 'zod';

export const createClassifiedSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priceCents: z.number().int().nonnegative().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export const updateClassifiedSchema = createClassifiedSchema.partial();

export type CreateClassifiedInput = z.infer<typeof createClassifiedSchema>;
export type UpdateClassifiedInput = z.infer<typeof updateClassifiedSchema>;
