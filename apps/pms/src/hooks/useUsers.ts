import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { User } from '@trinserhof/types';

/**
 * Real-time listener on the Firebase `users` collection (seeded from the
 * hardcoded allowed-user list via the "Seed users" migration). Returns the
 * users as an array, sorted/filtered by the consumer.
 */
const useUsers = () => {
  const [users, setUsers] = React.useState<User[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'users'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const docsAsArray: User[] = Object.keys(documents).map((id) => ({
          ...documents[id],
          id,
        }));
        setUsers(docsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return users;
};

export default useUsers;
