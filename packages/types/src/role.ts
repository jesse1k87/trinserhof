import { z } from 'zod';

// The set of protected resources a permission can target. Each is paired with a
// CRUD action (see CRUD_ACTIONS) to form an entity permission like "BOOKING:READ".
// `PAGE_*` entries gate access to whole pages rather than a database table.
export const ENTITIES = [
  'ACCOUNTING_CATEGORY',
  'AUDIT_LOG',
  'BOOKING',
  'CUSTOMER',
  'INVOICE',
  'PAGE_CALENDAR',
  'PAGE_CUSTOMER_MAP',
  'PAGE_CUSTOMER_MERGE_SUGGESTIONS',
  'PAGE_DASHBOARD',
  'PRICE',
  'PRODUCT',
  'PROPERTY',
  'RAW_DATA',
  'ROLE',
  'ROOM_TYPE',
  'ROOM',
  'TABLE_RESERVATION',
  'TABLE',
  'USER',
  'VERSION',
] as const;

export type Entity = (typeof ENTITIES)[number];

export const CRUD_ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'] as const;

export type CrudAction = (typeof CRUD_ACTIONS)[number];

// Capabilities are permissions that aren't a plain entity CRUD operation: they
// gate cross-cutting abilities like entering the app at all or merging customers.
export const CAPABILITIES = ['ENTER_APP', 'MERGE_CUSTOMERS'] as const;

export type Capability = (typeof CAPABILITIES)[number];

// A single grantable permission: either "<ENTITY>:<ACTION>" or a bare capability.
export type PermissionKey = `${Entity}:${CrudAction}` | Capability;

// Every permission a role can grant, in a stable display order (capabilities
// first, then each entity's CRUD actions). Used to render the role editor.
export const ALL_PERMISSIONS: PermissionKey[] = [
  ...CAPABILITIES,
  ...ENTITIES.flatMap((entity) => CRUD_ACTIONS.map((action) => `${entity}:${action}` as const)),
];

// A role is now referenced by its id (a short code such as "OWNER"); the role's
// name and granted permissions live in the database (see the Role model in
// @trinserhof/supabase). `Role` is that id reference as stored on a user.
export type Role = string;

export const DEFAULT_ROLE: Role = 'READER';

// The hotel owner's role id. Some destructive, owner-only operations (e.g.
// wiping whole tables from the "Wipe data" page) double-check against this
// directly, on top of the usual `<ENTITY>:DELETE` permission checks.
export const OWNER_ROLE: Role = 'OWNER';

export const isOwner = (role: Role): boolean => role === OWNER_ROLE;

// The full role definition as stored in (and loaded from) the database.
export type RoleDefinition = {
  id: string;
  name: string;
  permissions: PermissionKey[];
};

export const roleDefinitionSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  permissions: z.array(z.string({ message: 'Invalid permission' })),
});

// Role definitions are loaded from the database at sign-in (see
// @trinserhof/supabase's getSignedInUser / loadRoleDefinitions) and registered
// here so the synchronous permission checks below — used throughout the PMS UI —
// can resolve a user's role id to its granted permissions without prop-drilling
// the whole role table to every component.
let roleDefinitions: Record<Role, RoleDefinition> = {};

export const setRoleDefinitions = (definitions: RoleDefinition[]): void => {
  roleDefinitions = Object.fromEntries(
    definitions.map((definition) => [definition.id, definition]),
  );
};

export const getRoleDefinitions = (): RoleDefinition[] => Object.values(roleDefinitions);

export const getRoleDefinition = (role: Role): RoleDefinition | undefined => roleDefinitions[role];

const hasPermission = (role: Role, permission: PermissionKey): boolean =>
  roleDefinitions[role]?.permissions.includes(permission) ?? false;

export const canEnterApp = (role: Role): boolean => hasPermission(role, 'ENTER_APP');

export const canPerform = (role: Role, entity: Entity, action: CrudAction): boolean =>
  hasPermission(role, `${entity}:${action}`);

export const canMergeCustomers = (role: Role): boolean => hasPermission(role, 'MERGE_CUSTOMERS');
