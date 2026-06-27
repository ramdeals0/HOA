import { getWhisperGrovesDemoDocuments } from './demo-documents';

describe('getWhisperGrovesDemoDocuments', () => {
  it('returns HOA sample documents with web-hosted PDF URLs', () => {
    const documents = getWhisperGrovesDemoDocuments('https://hoa-web.up.railway.app');

    expect(documents.length).toBeGreaterThanOrEqual(8);
    expect(documents[0]).toMatchObject({
      title: 'Community Bylaws',
      visibility: 'PUBLIC',
      fileUrl: 'https://hoa-web.up.railway.app/sample-docs/community-bylaws.pdf',
    });
    expect(documents.some((doc) => doc.visibility === 'FINANCIAL')).toBe(true);
  });
});
