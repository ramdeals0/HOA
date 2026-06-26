import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  visibility: z.enum(['PUBLIC', 'MEMBERS', 'BOARD', 'FINANCIAL']),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
