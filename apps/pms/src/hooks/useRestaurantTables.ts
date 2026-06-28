import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { RestaurantTable } from '@trinserhof/types';

const useRestaurantTables = () => {
  const [tables, setTables] = React.useState<RestaurantTable[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'tables'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const tablesAsArray: RestaurantTable[] = Object.keys(documents).map((id) => documents[id]);

        setTables(tablesAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return tables;
};

export default useRestaurantTables;
