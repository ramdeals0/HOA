import { CONTENT_RETENTION_DAYS, getContentRetentionCutoff, getDaysUntilContentExpiry } from '@hoa/shared';
import { contentCreatedWithinRetention, purgeExpiredContent } from './content-retention';

describe('content retention', () => {
  it('uses a 30-day retention window', () => {
    expect(CONTENT_RETENTION_DAYS).toBe(30);
  });

  it('builds a prisma date filter for recent content', () => {
    const before = getContentRetentionCutoff();
    const filter = contentCreatedWithinRetention();
    const after = getContentRetentionCutoff();

    expect(filter.createdAt.gte.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(filter.createdAt.gte.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('calculates remaining days until expiry', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const now = new Date('2026-06-27T12:00:00.000Z');
    expect(getDaysUntilContentExpiry(createdAt, now)).toBe(23);
  });

  it('purges expired news and classified records', async () => {
    const newsPost = { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) };
    const classifiedListing = { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) };

    await purgeExpiredContent({ newsPost, classifiedListing } as never);

    expect(newsPost.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
    expect(classifiedListing.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
  });
});
