const mockTenantUserFindMany = jest.fn();
const mockPropertyFindMany = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    tenantUser: { findMany: mockTenantUserFindMany },
    property: { findMany: mockPropertyFindMany },
  },
}));

import { DirectoryService, buildDirectoryEntry } from './directory.service';

describe('buildDirectoryEntry', () => {
  const baseMember = {
    userId: 'user-1',
    directoryShareEmail: false,
    directorySharePhone: false,
    directoryShareAddress: false,
    directorySharePhoto: false,
    user: {
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Neighbor',
      email: 'jane@example.com',
      phone: '(555) 555-0100',
      photoUrl: 'https://example.com/jane.jpg',
    },
  };

  const property = {
    ownerId: 'user-1',
    street: '101 Whisper Grove Lane',
    lotNumber: 'WG-1',
  };

  it('always includes id and displayName', () => {
    const entry = buildDirectoryEntry(baseMember, property);

    expect(entry).toEqual({
      id: 'user-1',
      displayName: 'Jane Neighbor',
    });
  });

  it('omits all optional fields when share flags are false', () => {
    const entry = buildDirectoryEntry(baseMember, property);

    expect(entry).not.toHaveProperty('email');
    expect(entry).not.toHaveProperty('phone');
    expect(entry).not.toHaveProperty('address');
    expect(entry).not.toHaveProperty('photoUrl');
  });

  it('returns only fields allowed by mixed share flags', () => {
    const entry = buildDirectoryEntry(
      {
        ...baseMember,
        directoryShareEmail: true,
        directoryShareAddress: true,
      },
      property,
    );

    expect(entry).toEqual({
      id: 'user-1',
      displayName: 'Jane Neighbor',
      email: 'jane@example.com',
      address: {
        street: '101 Whisper Grove Lane',
        lot: 'WG-1',
      },
    });
    expect(entry).not.toHaveProperty('phone');
    expect(entry).not.toHaveProperty('photoUrl');
  });

  it('includes phone and photo only when both share flag and value exist', () => {
    const entry = buildDirectoryEntry(
      {
        ...baseMember,
        directorySharePhone: true,
        directorySharePhoto: true,
      },
      property,
    );

    expect(entry.phone).toBe('(555) 555-0100');
    expect(entry.photoUrl).toBe('https://example.com/jane.jpg');
    expect(entry).not.toHaveProperty('email');
    expect(entry).not.toHaveProperty('address');
  });
});

describe('DirectoryService', () => {
  let service: DirectoryService;

  beforeEach(() => {
    service = new DirectoryService();
    jest.clearAllMocks();
  });

  it('queries only tenant members opted into the directory', async () => {
    mockTenantUserFindMany.mockResolvedValue([]);
    mockPropertyFindMany.mockResolvedValue([]);

    await service.getDirectory('tenant-1');

    expect(mockTenantUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          status: 'ACTIVE',
          showInDirectory: true,
        },
      }),
    );
  });

  it('never includes members who are not returned by the opted-in query', async () => {
    mockTenantUserFindMany.mockResolvedValue([
      {
        userId: 'user-visible',
        directoryShareEmail: true,
        directorySharePhone: false,
        directoryShareAddress: false,
        directorySharePhoto: false,
        user: {
          id: 'user-visible',
          firstName: 'Visible',
          lastName: 'Member',
          email: 'visible@example.com',
          phone: null,
          photoUrl: null,
        },
      },
    ]);
    mockPropertyFindMany.mockResolvedValue([]);

    const residents = await service.getDirectory('tenant-1');

    expect(residents).toHaveLength(1);
    expect(residents[0]).toEqual({
      id: 'user-visible',
      displayName: 'Visible Member',
      email: 'visible@example.com',
    });
  });
});
