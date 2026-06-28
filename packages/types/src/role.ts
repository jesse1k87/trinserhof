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

export const CRUD_ACTIONS = ['CREATE', 'READ', 'UPDATE'] as const;

export type CrudAction = (typeof CRUD_ACTIONS)[number];

export const canEnterApp = (role: Role): boolean => roleAtLeast(role, 'VIEWER');

export const ENTITY_PERMISSIONS: Record<Entity, Record<CrudAction, Role>> = {
  // Viewer and up
  BOOKING: { READ: 'VIEWER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  TABLE_RESERVATION: { READ: 'VIEWER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  CUSTOMER: { READ: 'VIEWER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },

  // Manager and up
  INVOICE: { READ: 'VIEWER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  ROOM: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  TABLE: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  PRICE: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  PRODUCT: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },

  // Owner and up
  ACCOUNTING_CATEGORY: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  USER: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  AUDIT_LOG: { READ: 'VIEWER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  RAW_DATA: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  VERSION: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
};

export const canPerform = (role: Role, entity: Entity, action: CrudAction): boolean =>
  roleAtLeast(role, ENTITY_PERMISSIONS[entity][action]);
