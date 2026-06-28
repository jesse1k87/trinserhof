import * as React from 'react';
import { getSupabaseClient, type AuditLogEntry as AuditLogEntryRow } from '@trinserhof/supabase';
import { AuditLogEntry } from '@trinserhof/types';

const toAuditLogEntry = (row: AuditLogEntryRow): AuditLogEntry => ({
  id: row.id,
  email: row.email,
  event: row.event,
  timestamp: Number(row.timestamp),
});

/**
 * One-shot fetch against @trinserhof/supabase's AuditLogEntry table (the
 * append-only record of account activity, e.g. sign-in/sign-out). Returns the
 * entries as an array sorted newest-first.
 */
const useAuditLog = () => {
  const [entries, setEntries] = React.useState<AuditLogEntry[]>([]);

  React.useEffect(() => {
    let active = true;

    Promise.resolve(getSupabaseClient().from('AuditLogEntry').select('*'))
      .then(({ data, error }: { data: AuditLogEntryRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setEntries((data ?? []).map(toAuditLogEntry).sort((a, b) => b.timestamp - a.timestamp));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return entries;
};

export default useAuditLog;
