import { z } from 'zod';

export const ROLES = ['BLOCKED', 'READER', 'MANAGER', 'OWNER'] as const;

export const RoleEnum = z.enum(ROLES);

export type Role = z.infer<typeof RoleEnum>;

export const DEFAULT_ROLE: Role = 'READER';

const ROLE_RANK: Record<Role, number> = {
  BLOCKED: 0,
  READER: 1,
  MANAGER: 2,
  OWNER: 3,
};

export const roleAtLeast = (role: Role, minimum: Role): boolean =>
  ROLE_RANK[role] >= ROLE_RANK[minimum];

const ENTITIES = [
  'ACCOUNTING_CATEGORY',
  'AUDIT_LOG',
  'BOOKING',
  'CUSTOMER',
  'INVOICE',
  'PRICE',
  'PRODUCT',
  'RAW_DATA',
  'ROOM',
  'TABLE_RESERVATION',
  'TABLE',
  'USER',
  'VERSION',
  'PAGE_DASHBOARD',
  'PAGE_DATA_MIGRATION',
  'PAGE_CUSTOMER_MAP',
  'PAGE_CUSTOMER_MERGE_SUGGESTIONS',
] as const;

type Entity = (typeof ENTITIES)[number];

const CRUD_ACTIONS = ['CREATE', 'READ', 'UPDATE'] as const;

type CrudAction = (typeof CRUD_ACTIONS)[number];

export const ENTITY_PERMISSIONS: Record<Entity, Record<CrudAction, Role>> = {
  ACCOUNTING_CATEGORY: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  AUDIT_LOG: { READ: 'READER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  BOOKING: { READ: 'READER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  CUSTOMER: { READ: 'READER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  INVOICE: { READ: 'READER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  PAGE_DASHBOARD: { READ: 'READER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  PAGE_DATA_MIGRATION: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  PRICE: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  PRODUCT: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  RAW_DATA: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  ROOM: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  TABLE_RESERVATION: { READ: 'READER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  TABLE: { READ: 'MANAGER', CREATE: 'MANAGER', UPDATE: 'MANAGER' },
  USER: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  VERSION: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  PAGE_CUSTOMER_MAP: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
  PAGE_CUSTOMER_MERGE_SUGGESTIONS: { READ: 'OWNER', CREATE: 'OWNER', UPDATE: 'OWNER' },
};

export const canEnterApp = (role: Role): boolean => roleAtLeast(role, 'READER');

export const canPerform = (role: Role, entity: Entity, action: CrudAction): boolean =>
  roleAtLeast(role, ENTITY_PERMISSIONS[entity][action]);

export const canMergeCustomers = (role: Role): boolean => roleAtLeast(role, 'OWNER');
