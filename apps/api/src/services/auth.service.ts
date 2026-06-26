import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import { signToken } from '../lib/jwt';
import { AppError } from '../lib/types';
import { EmailService } from './email.service';

export class AuthService {
  constructor(private emailService: EmailService) {}

  async signup(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await hashPassword(data.password),
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new AppError(401, 'Invalid email or password');
    }

    const tenantUsers = await prisma.tenantUser.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    const token = signToken({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isPlatformOwner: user.isPlatformOwner,
      },
      tenants: tenantUsers.map((tu) => ({
        tenantId: tu.tenant.id,
        tenantName: tu.tenant.name,
        tenantSlug: tu.tenant.slug,
        role: tu.role,
      })),
    };
  }

  async selectTenant(userId: string, tenantId: string) {
    const tenantUser = await prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: { tenant: true, user: true },
    });

    if (!tenantUser || tenantUser.status !== 'ACTIVE') {
      throw new AppError(403, 'Not a member of this community');
    }

    const token = signToken({
      userId: tenantUser.user.id,
      email: tenantUser.user.email,
      tenantId: tenantUser.tenantId,
      tenantRole: tenantUser.role,
    });

    return {
      token,
      tenant: {
        id: tenantUser.tenant.id,
        name: tenantUser.tenant.name,
        slug: tenantUser.tenant.slug,
        role: tenantUser.role,
        plan: tenantUser.tenant.plan,
        primaryColor: tenantUser.tenant.primaryColor,
        logoUrl: tenantUser.tenant.logoUrl,
      },
    };
  }

  async getMe(userId: string, tenantId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isPlatformOwner: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const tenants = await prisma.tenantUser.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { tenant: { select: { id: true, name: true, slug: true, plan: true } } },
    });

    let currentTenant = null;
    if (tenantId) {
      const tu = tenants.find((t) => t.tenantId === tenantId);
      if (tu) {
        currentTenant = {
          id: tu.tenant.id,
          name: tu.tenant.name,
          slug: tu.tenant.slug,
          role: tu.role,
          plan: tu.tenant.plan,
        };
      }
    }

    return { user, tenants: tenants.map((t) => ({ tenantId: t.tenantId, role: t.role, tenant: t.tenant })), currentTenant };
  }
}

export class ApplicationService {
  constructor(private emailService: EmailService) {}

  async create(tenantId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    propertyAddress: string;
    lotNumber?: string;
    message?: string;
  }, applicantUserId?: string) {
    return prisma.membershipApplication.create({
      data: {
        tenantId,
        applicantUserId,
        ...data,
        status: 'PENDING',
      },
    });
  }

  async list(tenantId: string, status?: string) {
    return prisma.membershipApplication.findMany({
      where: { tenantId, ...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(tenantId: string, applicationId: string, reviewerId: string) {
    const app = await prisma.membershipApplication.findFirst({
      where: { id: applicationId, tenantId },
    });

    if (!app) throw new AppError(404, 'Application not found');
    if (app.status !== 'PENDING') throw new AppError(400, 'Application already processed');

    let user = app.applicantUserId
      ? await prisma.user.findUnique({ where: { id: app.applicantUserId } })
      : await prisma.user.findUnique({ where: { email: app.email } });

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-10);
      user = await prisma.user.create({
        data: {
          email: app.email,
          firstName: app.firstName,
          lastName: app.lastName,
          phone: app.phone,
          passwordHash: await hashPassword(tempPassword),
        },
      });

      await this.emailService.send({
        to: app.email,
        subject: 'Welcome to the community!',
        html: `<p>Your membership has been approved. Log in with email ${app.email} and temporary password: ${tempPassword}</p>`,
      });
    } else {
      await this.emailService.send({
        to: app.email,
        subject: 'Welcome to the community!',
        html: `<p>Your membership application has been approved. You can now log in to the member portal.</p>`,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.membershipApplication.update({
        where: { id: applicationId },
        data: { status: 'APPROVED', reviewedById: reviewerId, reviewedAt: new Date() },
      });

      const existing = await tx.tenantUser.findUnique({
        where: { tenantId_userId: { tenantId, userId: user!.id } },
      });

      if (!existing) {
        await tx.tenantUser.create({
          data: { tenantId, userId: user!.id, role: 'MEMBER', status: 'ACTIVE' },
        });
      }

      const property = await tx.property.create({
        data: {
          tenantId,
          ownerId: user!.id,
          street: app.propertyAddress,
          lotNumber: app.lotNumber,
        },
      });

      return property;
    });

    return prisma.membershipApplication.findUnique({ where: { id: applicationId } });
  }

  async reject(tenantId: string, applicationId: string, reviewerId: string) {
    const app = await prisma.membershipApplication.findFirst({
      where: { id: applicationId, tenantId },
    });
    if (!app) throw new AppError(404, 'Application not found');

    return prisma.membershipApplication.update({
      where: { id: applicationId },
      data: { status: 'REJECTED', reviewedById: reviewerId, reviewedAt: new Date() },
    });
  }
}

export class BlastService {
  constructor(private emailService: EmailService) {}

  async create(
    tenantId: string,
    authorId: string,
    data: {
      subject: string;
      body: string;
      audience: string;
      audienceRole?: Role;
      audienceStreet?: string;
      testSendToMe?: boolean;
    },
    authorEmail: string,
  ) {
    const blast = await prisma.blastMessage.create({
      data: {
        tenantId,
        authorId,
        subject: data.subject,
        body: data.body,
        audience: data.audience,
        audienceFilter: {
          role: data.audienceRole,
          street: data.audienceStreet,
        },
        status: 'QUEUED',
      },
    });

    if (data.testSendToMe) {
      await this.emailService.send({
        to: authorEmail,
        subject: `[TEST] ${data.subject}`,
        html: data.body,
      });
    }

    const recipients = await this.resolveRecipients(tenantId, data);

    let sentCount = 0;
    let failureCount = 0;

    for (const email of recipients) {
      try {
        await this.emailService.send({ to: email, subject: data.subject, html: data.body });
        sentCount++;
      } catch {
        failureCount++;
      }
    }

    await prisma.blastMessage.update({
      where: { id: blast.id },
      data: { status: failureCount > 0 && sentCount === 0 ? 'FAILED' : 'SENT', sentCount, failureCount },
    });

    await prisma.tenantSettings.updateMany({
      where: { tenantId },
      data: { lastEmailSentAt: new Date() },
    });

    return prisma.blastMessage.findUnique({ where: { id: blast.id } });
  }

  private async resolveRecipients(
    tenantId: string,
    data: { audience: string; audienceRole?: Role; audienceStreet?: string; testSendToMe?: boolean },
  ): Promise<string[]> {
    if (data.testSendToMe) return [];

    if (data.audience === 'ALL') {
      const users = await prisma.tenantUser.findMany({
        where: { tenantId, status: 'ACTIVE' },
        include: { user: { select: { email: true } } },
      });
      return users.map((u) => u.user.email);
    }

    if (data.audience === 'ROLE' && data.audienceRole) {
      const users = await prisma.tenantUser.findMany({
        where: { tenantId, status: 'ACTIVE', role: data.audienceRole },
        include: { user: { select: { email: true } } },
      });
      return users.map((u) => u.user.email);
    }

    if (data.audience === 'PROPERTY' && data.audienceStreet) {
      const properties = await prisma.property.findMany({
        where: { tenantId, street: { contains: data.audienceStreet, mode: 'insensitive' }, isActive: true },
        include: { owner: { select: { email: true } } },
      });
      return properties.filter((p) => p.owner).map((p) => p.owner!.email);
    }

    return [];
  }

  async list(tenantId: string) {
    return prisma.blastMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export class TenantService {
  async createWithAdmin(data: {
    name: string;
    slug: string;
    timezone?: string;
    locale?: string;
    address?: string;
    state?: string;
    primaryContactEmail: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
  }) {
    const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) throw new AppError(409, 'Slug already taken');

    let admin = await prisma.user.findUnique({ where: { email: data.adminEmail } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: data.adminEmail,
          passwordHash: await hashPassword(data.adminPassword),
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
        },
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        timezone: data.timezone ?? 'America/Chicago',
        locale: data.locale ?? 'en-US',
        address: data.address,
        state: data.state,
        primaryContactEmail: data.primaryContactEmail,
        settings: { create: {} },
        tenantUsers: {
          create: { userId: admin.id, role: 'BOARD', status: 'ACTIVE' },
        },
      },
      include: { settings: true },
    });

    return tenant;
  }

  async getBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug },
      include: { settings: true },
    });
  }

  async updateSettings(tenantId: string, data: Record<string, unknown>) {
    const { monthlyDuesCents, annualDuesCents, stripePublicKey, stripeSecretKey, stripeWebhookSecret, ...tenantData } = data;

    if (Object.keys(tenantData).length > 0) {
      await prisma.tenant.update({ where: { id: tenantId }, data: tenantData as never });
    }

    const settingsUpdate: Record<string, unknown> = {};
    if (monthlyDuesCents !== undefined) settingsUpdate.monthlyDuesCents = monthlyDuesCents;
    if (annualDuesCents !== undefined) settingsUpdate.annualDuesCents = annualDuesCents;
    if (stripePublicKey !== undefined) settingsUpdate.stripePublicKey = stripePublicKey;
    if (stripeSecretKey !== undefined) settingsUpdate.stripeSecretKey = stripeSecretKey;
    if (stripeWebhookSecret !== undefined) settingsUpdate.stripeWebhookSecret = stripeWebhookSecret;

    if (Object.keys(settingsUpdate).length > 0) {
      await prisma.tenantSettings.update({ where: { tenantId }, data: settingsUpdate });
    }

    return prisma.tenant.findUnique({ where: { id: tenantId }, include: { settings: true } });
  }
}
