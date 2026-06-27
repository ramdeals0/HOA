export type AuthMeResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    isPlatformOwner?: boolean;
  };
  currentTenant: {
    id: string;
    name: string;
    slug: string;
    role: string;
    plan?: string;
  } | null;
  tenants: Array<{
    tenantId: string;
    role: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
      plan?: string;
    };
  }>;
};

export function formatUserDisplayName(user?: AuthMeResponse['user']) {
  if (!user) {
    return 'Member';
  }
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

export function formatRoleLabel(role?: string) {
  if (!role) {
    return '';
  }
  return role
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
