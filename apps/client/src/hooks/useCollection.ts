import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { makeBookingBackwardsCompatible } from '@bookings/helpers';
import { getDb, BOOKINGS_PATH } from '@bookings/database';

const useCollection = (collectionName: string) => {
  const [documents, setDocuments] = React.useState([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(ref(db, BOOKINGS_PATH), (snapshot) => {
      const documents = snapshot.val();
      let docsAsArray = Object.keys(documents).map((id) => documents[id]);

      if (collectionName === 'bookings') {
        docsAsArray = docsAsArray
          .filter((b) => !b.deleted)
          .map((b) => makeBookingBackwardsCompatible(b));
      }

      setDocuments(docsAsArray as []);
    });

    return () => unsubscribe();
  }, [collectionName]);

  return documents;
};

export default useCollection;
