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
export const canUpdateRawData = (role: Role): boolean => roleAtLeast(role, 'OWNER');
export const canViewRawData = (role: Role): boolean => roleAtLeast(role, 'OWNER');

export const ENTITIES = [
  'BOOKING',
  'CUSTOMER',
  'PRODUCT',
  'PRODUCT_CATEGORY',
  'ROOM',
  'USER',
] as const;

export type Entity = (typeof ENTITIES)[number];

export const CRUD_ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE'] as const;

export type CrudAction = (typeof CRUD_ACTIONS)[number];

// Single source of truth for access control: minimum role required per entity, per CRUD action.
// Edit this table directly to change who can do what - every check goes through canPerform.
export const ENTITY_PERMISSIONS: Record<Entity, Record<CrudAction, Role>> = {
  BOOKING: { CREATE: 'MANAGER', READ: 'VIEWER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  CUSTOMER: { CREATE: 'MANAGER', READ: 'VIEWER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  PRODUCT: { CREATE: 'MANAGER', READ: 'VIEWER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  PRODUCT_CATEGORY: { CREATE: 'OWNER', READ: 'OWNER', UPDATE: 'OWNER', DELETE: 'OWNER' },
  ROOM: { CREATE: 'MANAGER', READ: 'VIEWER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  USER: { CREATE: 'OWNER', READ: 'OWNER', UPDATE: 'OWNER', DELETE: 'OWNER' },
};

export const canPerform = (role: Role, entity: Entity, action: CrudAction): boolean =>
  roleAtLeast(role, ENTITY_PERMISSIONS[entity][action]);
