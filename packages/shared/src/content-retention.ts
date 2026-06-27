export const CONTENT_RETENTION_DAYS = 30;

export function getContentRetentionCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - CONTENT_RETENTION_DAYS);
  return cutoff;
}

export function getContentExpirationDate(createdAt: Date | string, now = new Date()): Date {
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + CONTENT_RETENTION_DAYS);
  return expiresAt;
}

export function getDaysUntilContentExpiry(createdAt: Date | string, now = new Date()): number {
  const expiresAt = getContentExpirationDate(createdAt, now);
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}
