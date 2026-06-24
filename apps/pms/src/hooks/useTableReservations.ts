import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { TableReservation } from '@trinserhof/types';

const useTableReservations = () => {
  const [tableReservations, setTableReservations] = React.useState<TableReservation[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'tableReservations'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const tableReservationsAsArray: TableReservation[] = Object.keys(documents).map(
          (id) => documents[id],
        );

        setTableReservations(tableReservationsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return tableReservations;
};

export default useTableReservations;
