import { z } from 'zod';

export const createNewsSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  isPublic: z.boolean().default(true),
  isPublished: z.boolean().default(true),
});

export const updateNewsSchema = createNewsSchema.partial();

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
