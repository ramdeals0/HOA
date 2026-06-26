import { z } from 'zod';

export const updateDirectorySettingsSchema = z.object({
  showInDirectory: z.boolean(),
  shareEmail: z.boolean(),
  sharePhone: z.boolean(),
  shareAddress: z.boolean(),
  sharePhoto: z.boolean(),
});

export type UpdateDirectorySettingsInput = z.infer<typeof updateDirectorySettingsSchema>;

export const directorySettingsSchema = updateDirectorySettingsSchema;

export type DirectorySettings = z.infer<typeof directorySettingsSchema>;

export const directoryAddressSchema = z.object({
  street: z.string(),
  lot: z.string().nullable().optional(),
});

export const directoryEntrySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: directoryAddressSchema.optional(),
  photoUrl: z.string().url().optional(),
});

export type DirectoryEntry = z.infer<typeof directoryEntrySchema>;
