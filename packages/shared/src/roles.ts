export const ROLES = [
  'SUPER_ADMIN',
  'BOARD',
  'MANAGER',
  'MEMBER',
  'RESIDENT',
] as const;

export type Role = (typeof ROLES)[number];

export const BOARD_ROLES: Role[] = ['SUPER_ADMIN', 'BOARD'];
export const STAFF_ROLES: Role[] = ['SUPER_ADMIN', 'BOARD', 'MANAGER'];
export const MEMBER_ROLES: Role[] = ['SUPER_ADMIN', 'BOARD', 'MANAGER', 'MEMBER', 'RESIDENT'];

export function hasRole(userRole: Role, allowed: Role[]): boolean {
  return allowed.includes(userRole);
}
