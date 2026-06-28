import * as React from 'react';
import { getSupabaseClient, type Role as RoleRow } from '@trinserhof/supabase';
import { RoleDefinition, setRoleDefinitions } from '@trinserhof/types';

const toRoleDefinition = (row: RoleRow): RoleDefinition => ({
  id: row.id,
  name: row.name,
  permissions: row.permissions ?? [],
});

/**
 * One-shot fetch of the role definitions from @trinserhof/supabase's Role table.
 * Also re-registers them with @trinserhof/types (setRoleDefinitions) so the
 * synchronous permission checks stay in sync after a role is edited. Returns the
 * roles sorted by name.
 */
const useRoles = () => {
  const [roles, setRoles] = React.useState<RoleDefinition[]>([]);

  React.useEffect(() => {
    let active = true;

    Promise.resolve(getSupabaseClient().from('Role').select('*'))
      .then(({ data, error }: { data: RoleRow[] | null; error: unknown }) => {
        if (error) throw error;
        const definitions = (data ?? []).map(toRoleDefinition);
        if (active) {
          setRoleDefinitions(definitions);
          setRoles([...definitions].sort((a, b) => a.name.localeCompare(b.name)));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return roles;
};

export default useRoles;
