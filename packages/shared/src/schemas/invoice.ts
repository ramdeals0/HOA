import { z } from 'zod';

export const generateInvoicesSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  dueDate: z.string().datetime(),
  description: z.string().optional(),
});

export type GenerateInvoicesInput = z.infer<typeof generateInvoicesSchema>;

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const paymentHistoryQuerySchema = z
  .object({
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
  })
  .refine(
    (data) => {
      if (!data.from || !data.to) return true;
      return new Date(data.from) <= new Date(data.to);
    },
    { message: 'Start date must be on or before end date', path: ['to'] },
  );

export type PaymentHistoryQuery = z.infer<typeof paymentHistoryQuerySchema>;
