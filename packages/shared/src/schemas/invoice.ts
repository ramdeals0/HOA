import { z } from 'zod';

export const generateInvoicesSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  dueDate: z.string().datetime(),
  description: z.string().optional(),
});

export type GenerateInvoicesInput = z.infer<typeof generateInvoicesSchema>;
