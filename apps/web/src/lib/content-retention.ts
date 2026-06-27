import { CONTENT_RETENTION_DAYS } from '@hoa/shared';

export { CONTENT_RETENTION_DAYS, getDaysUntilContentExpiry } from '@hoa/shared';

export function formatContentExpiryLabel(createdAt: string) {
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + CONTENT_RETENTION_DAYS);
  const daysLeft = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  if (daysLeft === 0) {
    return 'Expires today';
  }

  if (daysLeft === 1) {
    return 'Expires in 1 day';
  }

  return `Expires in ${daysLeft} days`;
}

export const CONTENT_RETENTION_NOTICE = `Posts and classifieds are automatically removed after ${CONTENT_RETENTION_DAYS} days.`;
