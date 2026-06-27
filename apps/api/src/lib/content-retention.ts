import { getContentRetentionCutoff } from '@hoa/shared';
import type { PrismaClient } from '@prisma/client';

export { CONTENT_RETENTION_DAYS, getContentRetentionCutoff } from '@hoa/shared';

export function contentCreatedWithinRetention() {
  return { createdAt: { gte: getContentRetentionCutoff() } };
}

export async function purgeExpiredContent(prisma: PrismaClient) {
  const cutoff = getContentRetentionCutoff();
  const [news, classifieds] = await Promise.all([
    prisma.newsPost.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.classifiedListing.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);

  if (news.count > 0 || classifieds.count > 0) {
    console.log(
      `Purged ${news.count} expired news post(s) and ${classifieds.count} expired classified listing(s)`,
    );
  }
}
