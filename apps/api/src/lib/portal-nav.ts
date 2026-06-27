import {
  DEFAULT_PORTAL_OPTIONAL_NAV,
  mergePortalNavConfig,
  type PortalOptionalNavConfig,
} from '@hoa/shared';
import type { Prisma } from '@prisma/client';

export function parsePortalNavConfig(value: Prisma.JsonValue | null | undefined): PortalOptionalNavConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_PORTAL_OPTIONAL_NAV;
  }

  return mergePortalNavConfig(value as Partial<PortalOptionalNavConfig>);
}
