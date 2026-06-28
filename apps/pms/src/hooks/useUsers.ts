import * as React from 'react';
import { getDb, type User as UserRow } from '@trinserhof/supabase';
import { User } from '@trinserhof/types';

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  role: row.role,
  image: row.image ?? undefined,
  theme: row.theme ?? undefined,
});

/**
 * One-shot fetch against @trinserhof/supabase's User model (the source of
 * truth for who may sign in and who is an admin). Returns the users as an
 * array, sorted/filtered by the consumer.
 */
const useUsers = () => {
  const [users, setUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    let active = true;

    getDb()
      .user.findMany()
      .then((rows: UserRow[]) => {
        if (active) {
          setUsers(rows.map(toUser));
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
