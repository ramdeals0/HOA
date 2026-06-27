import { z } from 'zod';

export const PORTAL_OPTIONAL_NAV_KEYS = [
  'events',
  'directory',
  'privacySettings',
  'news',
  'voting',
  'classifieds',
  'postClassified',
] as const;

export type PortalOptionalNavKey = (typeof PORTAL_OPTIONAL_NAV_KEYS)[number];

export const portalOptionalNavSchema = z.object({
  events: z.boolean().default(false),
  directory: z.boolean().default(false),
  privacySettings: z.boolean().default(false),
  news: z.boolean().default(false),
  voting: z.boolean().default(false),
  classifieds: z.boolean().default(false),
  postClassified: z.boolean().default(false),
});

export type PortalOptionalNavConfig = z.infer<typeof portalOptionalNavSchema>;

export const DEFAULT_PORTAL_OPTIONAL_NAV: PortalOptionalNavConfig = {
  events: false,
  directory: false,
  privacySettings: false,
  news: false,
  voting: false,
  classifieds: false,
  postClassified: false,
};

export const updatePortalNavConfigSchema = portalOptionalNavSchema.partial();

export type UpdatePortalNavConfigInput = z.infer<typeof updatePortalNavConfigSchema>;

export function mergePortalNavConfig(
  config?: Partial<PortalOptionalNavConfig> | null,
): PortalOptionalNavConfig {
  return portalOptionalNavSchema.parse({
    ...DEFAULT_PORTAL_OPTIONAL_NAV,
    ...(config ?? {}),
  });
}

export const PORTAL_OPTIONAL_NAV_LABELS: Record<PortalOptionalNavKey, string> = {
  events: 'Events Calendar',
  directory: 'Resident Directory',
  privacySettings: 'Privacy Settings',
  news: 'News',
  voting: 'Community Voting',
  classifieds: 'Classifieds',
  postClassified: 'Post Classified',
};
