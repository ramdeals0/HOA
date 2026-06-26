import { z } from 'zod';

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const meetingTypeSchema = z.enum(['GENERAL', 'ANNUAL', 'BOARD', 'SPECIAL', 'SOCIAL']);

export const meetingQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
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

export const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  scheduledAt: z.string().datetime(),
  location: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  meetingType: meetingTypeSchema.default('GENERAL'),
});

export const updateMeetingSchema = createMeetingSchema.partial();

export type MeetingType = z.infer<typeof meetingTypeSchema>;
export type MeetingQuery = z.infer<typeof meetingQuerySchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
