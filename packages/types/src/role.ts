import { z } from 'zod';

export const ROLES = ['BLOCKED', 'VIEWER', 'MANAGER', 'OWNER'] as const;

export const RoleEnum = z.enum(ROLES);

export type Role = z.infer<typeof RoleEnum>;

export const DEFAULT_ROLE: Role = 'VIEWER';

export const ROLE_RANK: Record<Role, number> = {
  BLOCKED: 0,
  VIEWER: 1,
  MANAGER: 2,
  OWNER: 3,
};

export const roleAtLeast = (role: Role, minimum: Role): boolean =>
  ROLE_RANK[role] >= ROLE_RANK[minimum];

export const canAccess = (role: Role): boolean => roleAtLeast(role, 'VIEWER');
export const canUpdateRoleOfUser = (role: Role): boolean => roleAtLeast(role, 'OWNER');
export const canCreateReservation = (role: Role): boolean => roleAtLeast(role, 'MANAGER');
export const canDelete = (role: Role): boolean => roleAtLeast(role, 'OWNER');
export const canUpdateReservations = (role: Role): boolean => roleAtLeast(role, 'MANAGER');
export const canUpdateRawData = (role: Role): boolean => roleAtLeast(role, 'OWNER');
export const canViewRawData = (role: Role): boolean => roleAtLeast(role, 'OWNER');
