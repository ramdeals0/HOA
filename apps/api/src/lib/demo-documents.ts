import type { DocumentVisibility, PrismaClient } from '@prisma/client';

export type DemoDocumentInput = {
  title: string;
  description: string;
  fileUrl: string;
  visibility: DocumentVisibility;
};

export function getWhisperGrovesDemoDocuments(webBaseUrl: string): DemoDocumentInput[] {
  const base = webBaseUrl.replace(/\/$/, '');

  return [
    {
      title: 'Community Bylaws',
      description: 'Governing bylaws for Whisper Groves homeowners.',
      fileUrl: `${base}/sample-docs/community-bylaws.pdf`,
      visibility: 'PUBLIC',
    },
    {
      title: 'CC&Rs and Covenants',
      description: 'Covenants, conditions, and restrictions for all properties.',
      fileUrl: `${base}/sample-docs/ccrs-covenants.pdf`,
      visibility: 'PUBLIC',
    },
    {
      title: 'New Homeowner Welcome Packet',
      description: 'Move-in checklist, contacts, and community overview.',
      fileUrl: `${base}/sample-docs/welcome-packet.pdf`,
      visibility: 'PUBLIC',
    },
    {
      title: 'Architectural Guidelines',
      description: 'Exterior modification standards and approval process.',
      fileUrl: `${base}/sample-docs/architectural-guidelines.pdf`,
      visibility: 'MEMBERS',
    },
    {
      title: 'Pool Rules and Hours',
      description: 'Pool access rules, guest policy, and seasonal hours.',
      fileUrl: `${base}/sample-docs/pool-rules.pdf`,
      visibility: 'MEMBERS',
    },
    {
      title: 'Board Meeting Minutes — Q1',
      description: 'Approved minutes from the first quarter board meeting.',
      fileUrl: `${base}/sample-docs/board-minutes-q1.pdf`,
      visibility: 'BOARD',
    },
    {
      title: 'Annual Budget Summary',
      description: 'Approved operating budget and assessment overview.',
      fileUrl: `${base}/sample-docs/annual-budget.pdf`,
      visibility: 'FINANCIAL',
    },
    {
      title: 'Reserve Study Summary',
      description: 'Reserve fund projections and capital plan highlights.',
      fileUrl: `${base}/sample-docs/reserve-study.pdf`,
      visibility: 'FINANCIAL',
    },
  ];
}

export async function ensureWhisperGrovesDemoDocuments(prisma: PrismaClient) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'whisper-groves' },
    select: { id: true },
  });

  if (!tenant) {
    return;
  }

  const boardMember = await prisma.tenantUser.findFirst({
    where: {
      tenantId: tenant.id,
      role: { in: ['BOARD', 'SUPER_ADMIN'] },
      status: 'ACTIVE',
    },
    select: { userId: true },
  });

  if (!boardMember) {
    return;
  }

  const webBaseUrl = process.env.WEB_URL ?? 'http://localhost:3000';
  const demoDocuments = getWhisperGrovesDemoDocuments(webBaseUrl);

  for (const document of demoDocuments) {
    const existing = await prisma.document.findFirst({
      where: {
        tenantId: tenant.id,
        title: document.title,
      },
    });

    if (existing) {
      if (existing.fileUrl.includes('example.com')) {
        await prisma.document.update({
          where: { id: existing.id },
          data: {
            description: document.description,
            fileUrl: document.fileUrl,
            visibility: document.visibility,
          },
        });
      }
      continue;
    }

    await prisma.document.create({
      data: {
        tenantId: tenant.id,
        uploadedById: boardMember.userId,
        ...document,
      },
    });
  }
}
