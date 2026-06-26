import { z } from 'zod';

export const createApplicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  propertyAddress: z.string().min(1),
  lotNumber: z.string().optional(),
  message: z.string().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
