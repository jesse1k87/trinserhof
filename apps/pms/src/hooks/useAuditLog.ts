import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { AuditLogEntry } from '@trinserhof/types';

/**
 * Real-time listener on the Firebase `auditLog` collection (the append-only
 * record of account activity, e.g. sign-in/sign-out). Returns the entries as an
 * array sorted newest-first.
 */
const useAuditLog = () => {
  const [entries, setEntries] = React.useState<AuditLogEntry[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'auditLog'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const docsAsArray: AuditLogEntry[] = Object.keys(documents).map((id) => ({
          ...documents[id],
          id,
        }));
        docsAsArray.sort((a, b) => b.timestamp - a.timestamp);
        setEntries(docsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return entries;
};

export default useAuditLog;
