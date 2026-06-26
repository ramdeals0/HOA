import { z } from 'zod';

export const createBlastSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  audience: z.enum(['ALL', 'ROLE', 'PROPERTY']),
  audienceRole: z.enum(['SUPER_ADMIN', 'BOARD', 'MANAGER', 'MEMBER', 'RESIDENT']).optional(),
  audienceStreet: z.string().optional(),
  testSendToMe: z.boolean().default(false),
});

export type CreateBlastInput = z.infer<typeof createBlastSchema>;
