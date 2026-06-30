import * as React from 'react';
import { getSupabaseClient, type User as UserRow } from '@trinserhof/supabase';
import { type Locale, User } from '@trinserhof/types';

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  role: row.role,
  image: row.image ?? undefined,
  theme: row.theme ?? undefined,
  locale: (row.locale as Locale | null) ?? undefined,
});

/**
 * One-shot fetch against @trinserhof/supabase's User table (the source of
 * truth for who may sign in and who is an admin). Returns the users as an
 * array, sorted/filtered by the consumer.
 */
const useUsers = () => {
  const [users, setUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    let active = true;

    Promise.resolve(getSupabaseClient().from('User').select('*'))
      .then(({ data, error }: { data: UserRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setUsers((data ?? []).map(toUser));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return users;
};

export default useUsers;
