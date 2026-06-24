import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { Booking } from '@trinserhof/types';

const useCollection = (collectionName: string) => {
  const [documents, setDocuments] = React.useState<Booking[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'bookings'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const docsAsArray: Booking[] = Object.keys(documents).map((id) => documents[id]);

        setDocuments(docsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [collectionName]);

  return documents;
};

export default useCollection;
