import { type RoleDefinition } from '@trinserhof/types';

// The reference roles every build must have. A user's `role` column references
// one of these by `id`. Two roles are seeded:
//   - BLOCKED: the default role for every newly self-registered user. It grants
//     no permissions at all, so a blocked user can't enter the app until an
//     admin assigns them a role with access.
//   - OWNER: can enter the app and manage roles, nothing else — grant further
//     permissions from the PMS "Roles" page once seeded.
// This fixture is only applied when a role with the same id is missing (see
// prisma/seed.ts).
export const ROLES: RoleDefinition[] = [
  {
    id: 'BLOCKED',
    name: 'Blocked',
    permissions: [],
  },
  {
    id: 'OWNER',
    name: 'Owner',
    permissions: ['ENTER_APP', 'ROLE:CREATE', 'ROLE:READ', 'ROLE:UPDATE'],
  },
];
