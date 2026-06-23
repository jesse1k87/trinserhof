import { z } from 'zod';

// User access roles, ordered least → most privileged. A user's role lives on
// their `users/$id` record in Firebase and is the source of truth for access:
//   BLOCKED — has a record but is denied access (cannot even view)
//   VIEWER  — read-only access (the default for a new/unspecified user)
//   MANAGER — may edit bookings (everything VIEWER can do, plus editing)
//   OWNER   — full access (everything MANAGER can do)
// Edit ("admin") rights are granted to MANAGER or higher — see `canEdit`.
export const ROLES = ['BLOCKED', 'VIEWER', 'MANAGER', 'OWNER'] as const;

export const RoleEnum = z.enum(ROLES);

export type Role = z.infer<typeof RoleEnum>;

/** The role a brand-new / unspecified user record falls back to. */
export const DEFAULT_ROLE: Role = 'VIEWER';

/** Rank of each role (higher = more privileged), for threshold comparisons. */
export const ROLE_RANK: Record<Role, number> = {
  BLOCKED: 0,
  VIEWER: 1,
  MANAGER: 2,
  OWNER: 3,
};

/** Whether `role` meets or exceeds `minimum` in the hierarchy. */
export const roleAtLeast = (role: Role, minimum: Role): boolean =>
  ROLE_RANK[role] >= ROLE_RANK[minimum];

/** Whether a role grants edit ("admin") rights: MANAGER or higher. */
export const canEdit = (role: Role): boolean => roleAtLeast(role, 'MANAGER');

/** Whether a role grants any access at all: VIEWER or higher (BLOCKED does not). */
export const canAccess = (role: Role): boolean => roleAtLeast(role, 'VIEWER');
