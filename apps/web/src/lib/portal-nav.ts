import type { PortalOptionalNavConfig, PortalOptionalNavKey } from '@hoa/shared';

export function isPortalStaffRole(role?: string) {
  return Boolean(role && ['SUPER_ADMIN', 'BOARD', 'MANAGER'].includes(role));
}

export function isPortalFeatureEnabled(
  key: PortalOptionalNavKey,
  role: string | undefined,
  portalNav: PortalOptionalNavConfig | undefined,
) {
  if (isPortalStaffRole(role)) {
    return true;
  }

  return portalNav?.[key] === true;
}

export function getEnabledPortalFeatures(
  role: string | undefined,
  portalNav: PortalOptionalNavConfig | undefined,
) {
  return {
    events: isPortalFeatureEnabled('events', role, portalNav),
    directory: isPortalFeatureEnabled('directory', role, portalNav),
    privacySettings: isPortalFeatureEnabled('privacySettings', role, portalNav),
    news: isPortalFeatureEnabled('news', role, portalNav),
    voting: isPortalFeatureEnabled('voting', role, portalNav),
    classifieds: isPortalFeatureEnabled('classifieds', role, portalNav),
    postClassified: isPortalFeatureEnabled('postClassified', role, portalNav),
  };
}
