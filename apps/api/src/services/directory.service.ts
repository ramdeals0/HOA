import { prisma } from '../lib/prisma';
import { AppError } from '../lib/types';
import type { DirectoryEntry, UpdateDirectorySettingsInput } from '@hoa/shared';

type DirectoryMemberRow = {
  userId: string;
  directoryShareEmail: boolean;
  directorySharePhone: boolean;
  directoryShareAddress: boolean;
  directorySharePhoto: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    photoUrl: string | null;
  };
};

type DirectoryProperty = {
  ownerId: string | null;
  street: string;
  lotNumber: string | null;
};

export function buildDirectoryEntry(
  member: DirectoryMemberRow,
  property?: DirectoryProperty | null,
): DirectoryEntry {
  const entry: DirectoryEntry = {
    id: member.user.id,
    displayName: `${member.user.firstName} ${member.user.lastName}`.trim(),
  };

  if (member.directoryShareEmail) {
    entry.email = member.user.email;
  }

  if (member.directorySharePhone && member.user.phone) {
    entry.phone = member.user.phone;
  }

  if (member.directoryShareAddress && property) {
    entry.address = {
      street: property.street,
      lot: property.lotNumber,
    };
  }

  if (member.directorySharePhoto && member.user.photoUrl) {
    entry.photoUrl = member.user.photoUrl;
  }

  return entry;
}

export class DirectoryService {
  async getDirectory(tenantId: string): Promise<DirectoryEntry[]> {
    const members = await prisma.tenantUser.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        showInDirectory: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            photoUrl: true,
          },
        },
      },
      orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
    });

    if (members.length === 0) {
      return [];
    }

    const userIds = members.map((member) => member.userId);
    const properties = await prisma.property.findMany({
      where: {
        tenantId,
        ownerId: { in: userIds },
        isActive: true,
      },
      orderBy: { street: 'asc' },
    });

    const propertyByOwner = new Map<string, DirectoryProperty>();
    for (const property of properties) {
      if (property.ownerId && !propertyByOwner.has(property.ownerId)) {
        propertyByOwner.set(property.ownerId, property);
      }
    }

    return members.map((member) =>
      buildDirectoryEntry(member, propertyByOwner.get(member.userId) ?? null),
    );
  }

  async getDirectorySettings(tenantId: string, userId: string) {
    const tenantUser = await prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      select: {
        showInDirectory: true,
        directoryShareEmail: true,
        directorySharePhone: true,
        directoryShareAddress: true,
        directorySharePhoto: true,
      },
    });

    if (!tenantUser) {
      throw new AppError(404, 'Membership not found');
    }

    return {
      showInDirectory: tenantUser.showInDirectory,
      shareEmail: tenantUser.directoryShareEmail,
      sharePhone: tenantUser.directorySharePhone,
      shareAddress: tenantUser.directoryShareAddress,
      sharePhoto: tenantUser.directorySharePhoto,
    };
  }

  async updateDirectorySettings(
    tenantId: string,
    userId: string,
    settings: UpdateDirectorySettingsInput,
  ) {
    const tenantUser = await prisma.tenantUser.update({
      where: { tenantId_userId: { tenantId, userId } },
      data: {
        showInDirectory: settings.showInDirectory,
        directoryShareEmail: settings.shareEmail,
        directorySharePhone: settings.sharePhone,
        directoryShareAddress: settings.shareAddress,
        directorySharePhoto: settings.sharePhoto,
      },
      select: {
        showInDirectory: true,
        directoryShareEmail: true,
        directorySharePhone: true,
        directoryShareAddress: true,
        directorySharePhoto: true,
      },
    });

    return {
      showInDirectory: tenantUser.showInDirectory,
      shareEmail: tenantUser.directoryShareEmail,
      sharePhone: tenantUser.directorySharePhone,
      shareAddress: tenantUser.directoryShareAddress,
      sharePhoto: tenantUser.directorySharePhoto,
    };
  }
}

export const directoryService = new DirectoryService();
