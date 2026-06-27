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

export const ENTITIES = [
  'BOOKING',
  'CUSTOMER',
  'INVOICE',
  'PRODUCT',
  'ACCOUNTING_CATEGORY',
  'ROOM',
  'PRICE',
  'TABLE',
  'TABLE_RESERVATION',
  'USER',
  'AUDIT_LOG',
  'RAW_DATA',
  'VERSION',
] as const;

export type Entity = (typeof ENTITIES)[number];

export const CRUD_ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE'] as const;

export type CrudAction = (typeof CRUD_ACTIONS)[number];

export const canEnterApp = (role: Role): boolean => roleAtLeast(role, 'VIEWER');

export const ENTITY_PERMISSIONS: Record<Entity, Record<CrudAction, Role>> = {
  // Viewer and up
  BOOKING: { READ: 'VIEWER', CREATE: 'MANAGER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  TABLE_RESERVATION: { READ: 'VIEWER', CREATE: 'MANAGER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  CUSTOMER: { READ: 'VIEWER', CREATE: 'MANAGER', UPDATE: 'MANAGER', DELETE: 'OWNER' },

  // Manager and up
  INVOICE: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  ROOM: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  TABLE: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  PRICE: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER', DELETE: 'OWNER' },
  PRODUCT: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER', DELETE: 'OWNER' },

  // Owner and up
  ACCOUNTING_CATEGORY: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER', DELETE: 'OWNER' },
  USER: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER', DELETE: 'OWNER' },
  AUDIT_LOG: { READ: 'VIEWER', CREATE: 'OWNER', UPDATE: 'OWNER', DELETE: 'OWNER' },
  RAW_DATA: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER', DELETE: 'OWNER' },
  VERSION: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER', DELETE: 'OWNER' },
};

export const canPerform = (role: Role, entity: Entity, action: CrudAction): boolean =>
  roleAtLeast(role, ENTITY_PERMISSIONS[entity][action]);
