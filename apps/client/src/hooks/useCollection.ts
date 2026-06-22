import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { makeBookingBackwardsCompatible } from '@trinserhof/helpers';
import { getDb } from '@trinserhof/database';
import { Booking } from '@trinserhof/types';

const useCollection = (collectionName: string) => {
  const [documents, setDocuments] = React.useState<Booking[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(ref(db, 'bookings'), (snapshot) => {
      const documents = snapshot.val();
      let docsAsArray: Booking[] = Object.keys(documents).map((id) => documents[id]);

      if (collectionName === 'bookings') {
        docsAsArray = docsAsArray
          .filter((b) => !b.deleted)
          .map((b) => makeBookingBackwardsCompatible(b));
      }

      setDocuments(docsAsArray);
    });

    return () => unsubscribe();
  }, [collectionName]);

  return documents;
};

export default useCollection;
