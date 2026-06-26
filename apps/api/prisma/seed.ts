import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function createTenantWithData(params: {
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  primaryColor: string;
  monthlyDuesCents: number;
}) {
  const tenant = await prisma.tenant.create({
    data: {
      name: params.name,
      slug: params.slug,
      primaryContactEmail: `contact@${params.slug.replace(/-/g, '')}.example.com`,
      plan: params.plan,
      primaryColor: params.primaryColor,
      address: '123 Community Lane',
      state: 'MN',
      settings: {
        create: {
          monthlyDuesCents: params.monthlyDuesCents,
          annualDuesCents: params.monthlyDuesCents,
        },
      },
    },
  });

  return tenant;
}

async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  isPlatformOwner = false,
) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      isPlatformOwner,
    },
  });
}

async function assignRole(tenantId: string, userId: string, role: Role) {
  return prisma.tenantUser.create({
    data: { tenantId, userId, role, status: 'ACTIVE' },
  });
}

async function main() {
  console.log('Seeding database...');

  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.communityMeeting.deleteMany();
  await prisma.document.deleteMany();
  await prisma.classifiedListing.deleteMany();
  await prisma.blastMessage.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.membershipApplication.deleteMany();
  await prisma.property.deleteMany();
  await prisma.tenantUser.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();

  const password = 'Password123!';

  // Platform owner
  const platformOwner = await createUser(
    'platform@hoa-saas.example.com',
    password,
    'Platform',
    'Owner',
    true,
  );

  // Multi-tenant board member
  const dualBoardMember = await createUser('dual.board@example.com', password, 'Dana', 'Boardman');

  // Tenant 1: Whisper Groves
  const whisperGroves = await createTenantWithData({
    name: '1st Addition Whisper Groves Home Owners Association',
    slug: 'whisper-groves',
    plan: 'PRO',
    primaryColor: '#2563eb',
    monthlyDuesCents: 5000,
  });

  const superAdmin = await createUser('superadmin@whispergroves.example.com', password, 'Sam', 'Admin');
  await assignRole(whisperGroves.id, superAdmin.id, 'SUPER_ADMIN');
  await assignRole(whisperGroves.id, dualBoardMember.id, 'BOARD');

  const board1 = await createUser('board1@whispergroves.example.com', password, 'Barbara', 'Board');
  const board2 = await createUser('board2@whispergroves.example.com', password, 'Bob', 'Board');
  await assignRole(whisperGroves.id, board1.id, 'BOARD');
  await assignRole(whisperGroves.id, board2.id, 'BOARD');

  const members = [];
  for (let i = 1; i <= 10; i++) {
    const member = await createUser(
      `member${i}@whispergroves.example.com`,
      password,
      `Member${i}`,
      'Homeowner',
    );
    await assignRole(whisperGroves.id, member.id, 'MEMBER');

    const property = await prisma.property.create({
      data: {
        tenantId: whisperGroves.id,
        ownerId: member.id,
        street: `${100 + i} Whisper Grove Lane`,
        lotNumber: `WG-${i}`,
        city: 'Maple Grove',
        state: 'MN',
        zip: '55369',
      },
    });

    members.push({ member, property });
  }

  // Sample news
  await prisma.newsPost.createMany({
    data: [
      {
        tenantId: whisperGroves.id,
        authorId: board1.id,
        title: 'Welcome to Whisper Groves',
        body: '<p>Welcome to our beautiful community! We are excited to have you here.</p>',
        isPublic: true,
        isPublished: true,
      },
      {
        tenantId: whisperGroves.id,
        authorId: board1.id,
        title: 'Spring Cleanup Day',
        body: '<p>Join us Saturday for community cleanup. Bring gloves and enthusiasm!</p>',
        isPublic: true,
        isPublished: true,
      },
      {
        tenantId: whisperGroves.id,
        authorId: board2.id,
        title: 'Board Meeting Minutes - March',
        body: '<p>Members-only: Board approved new landscaping contract.</p>',
        isPublic: false,
        isPublished: true,
      },
    ],
  });

  // Sample classified (approved)
  await prisma.classifiedListing.create({
    data: {
      tenantId: whisperGroves.id,
      authorId: members[0].member.id,
      title: 'Patio Furniture Set',
      description: 'Gently used 5-piece patio set. Pick up only.',
      category: 'Furniture',
      priceCents: 25000,
      status: 'APPROVED',
      reviewedById: board1.id,
      reviewedAt: new Date(),
    },
  });

  // Pending classified
  await prisma.classifiedListing.create({
    data: {
      tenantId: whisperGroves.id,
      authorId: members[1].member.id,
      title: 'Kids Bike',
      description: '20-inch bike, good condition.',
      category: 'Sports',
      priceCents: 7500,
      status: 'PENDING',
    },
  });

  // Annual $50 dues on January 1 for the last 3 years (all active members)
  const now = new Date();
  const annualDuesCents = 5000;
  const currentYear = now.getFullYear();
  const annualYears = [currentYear - 2, currentYear - 1, currentYear];
  const allDuesUserIds = [
    ...members.map(({ member }) => member.id),
    board1.id,
    board2.id,
    dualBoardMember.id,
  ];

  for (const year of annualYears) {
    const periodStart = new Date(year, 0, 1);
    const periodEnd = new Date(year, 11, 31, 23, 59, 59);
    const dueDate = new Date(year, 0, 1);
    const paidAt = new Date(year, 0, 1, 12, 0, 0);

    for (const userId of allDuesUserIds) {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: whisperGroves.id,
          userId,
          amountCents: annualDuesCents,
          description: `Annual HOA Dues ${year}`,
          periodStart,
          periodEnd,
          dueDate,
          status: 'PAID',
          createdAt: periodStart,
        },
      });

      await prisma.payment.create({
        data: {
          tenantId: whisperGroves.id,
          invoiceId: invoice.id,
          userId,
          amountCents: annualDuesCents,
          status: 'SUCCEEDED',
          createdAt: paidAt,
        },
      });
    }
  }

  // Documents
  await prisma.document.createMany({
    data: [
      {
        tenantId: whisperGroves.id,
        uploadedById: board1.id,
        title: 'Community Bylaws Summary',
        description: 'Overview of HOA bylaws and rules',
        fileUrl: 'https://example.com/docs/bylaws.pdf',
        visibility: 'PUBLIC',
      },
      {
        tenantId: whisperGroves.id,
        uploadedById: board1.id,
        title: 'Welcome Packet',
        description: 'New homeowner welcome information',
        fileUrl: 'https://example.com/docs/welcome.pdf',
        visibility: 'PUBLIC',
      },
      {
        tenantId: whisperGroves.id,
        uploadedById: board1.id,
        title: 'Financial Report Q1',
        description: 'Quarterly financial summary',
        fileUrl: 'https://example.com/docs/financial-q1.pdf',
        visibility: 'FINANCIAL',
      },
    ],
  });

  // Pending application
  await prisma.membershipApplication.create({
    data: {
      tenantId: whisperGroves.id,
      firstName: 'Alex',
      lastName: 'Applicant',
      email: 'alex.applicant@example.com',
      propertyAddress: '999 Whisper Grove Lane',
      lotNumber: 'WG-NEW',
      message: 'We recently purchased a home in the community.',
      status: 'PENDING',
    },
  });

  const year = new Date().getFullYear();
  await prisma.communityMeeting.createMany({
    data: [
      {
        tenantId: whisperGroves.id,
        title: 'Annual HOA Meeting',
        scheduledAt: new Date(year, 2, 15, 18, 0),
        location: 'Community Clubhouse',
        description: 'Annual membership meeting — budget vote and board elections.',
        meetingType: 'ANNUAL',
      },
      {
        tenantId: whisperGroves.id,
        title: 'Spring Board Meeting',
        scheduledAt: new Date(year, 4, 20, 18, 30),
        location: 'Community Clubhouse',
        description: 'Open session for homeowner questions.',
        meetingType: 'BOARD',
      },
      {
        tenantId: whisperGroves.id,
        title: 'Budget & Dues Review',
        scheduledAt: new Date(year, 8, 10, 18, 0),
        location: 'Virtual (Zoom link in member portal)',
        description: 'Review proposed dues and reserve fund allocations.',
        meetingType: 'SPECIAL',
      },
      {
        tenantId: whisperGroves.id,
        title: 'Year-End Community Meeting',
        scheduledAt: new Date(year, 11, 5, 18, 0),
        location: 'Community Clubhouse',
        description: 'Wrap-up of the year and preview of upcoming projects.',
        meetingType: 'ANNUAL',
      },
    ],
  });

  // Tenant 2: Lakeside
  const lakeside = await createTenantWithData({
    name: 'Sample Lakeside HOA',
    slug: 'lakeside',
    plan: 'FREE',
    primaryColor: '#059669',
    monthlyDuesCents: 12000,
  });

  await assignRole(lakeside.id, dualBoardMember.id, 'BOARD');

  const lakesideBoard = await createUser('board@lakeside.example.com', password, 'Lake', 'Board');
  await assignRole(lakeside.id, lakesideBoard.id, 'BOARD');

  for (let i = 1; i <= 5; i++) {
    const member = await createUser(`homeowner${i}@lakeside.example.com`, password, `Lake${i}`, 'Resident');
    await assignRole(lakeside.id, member.id, 'MEMBER');
    await prisma.property.create({
      data: {
        tenantId: lakeside.id,
        ownerId: member.id,
        street: `${200 + i} Lakeside Drive`,
        lotNumber: `LS-${i}`,
        city: 'Lakeville',
        state: 'MN',
        zip: '55044',
      },
    });
  }

  await prisma.newsPost.create({
    data: {
      tenantId: lakeside.id,
      authorId: lakesideBoard.id,
      title: 'Lake Season Kickoff',
      body: '<p>Boat dock assignments are now available.</p>',
      isPublic: true,
      isPublished: true,
    },
  });

  await prisma.communityMeeting.createMany({
    data: [
      {
        tenantId: lakeside.id,
        title: 'Annual HOA Meeting',
        scheduledAt: new Date(year, 3, 12, 17, 30),
        location: 'Lakeside Pavilion',
        meetingType: 'ANNUAL',
      },
      {
        tenantId: lakeside.id,
        title: 'Fall Board Meeting',
        scheduledAt: new Date(year, 9, 8, 18, 0),
        location: 'Lakeside Pavilion',
        meetingType: 'BOARD',
      },
    ],
  });

  console.log('Seed complete!');
  console.log('');
  console.log('Test credentials (password: Password123!):');
  console.log('  Platform owner: platform@hoa-saas.example.com');
  console.log('  Dual-tenant board: dual.board@example.com');
  console.log('  Whisper Groves super admin: superadmin@whispergroves.example.com');
  console.log('  Whisper Groves member: member1@whispergroves.example.com');
  console.log('  Lakeside board: board@lakeside.example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
