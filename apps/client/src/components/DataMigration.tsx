import * as React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ScrollArea,
  NoEditingAllowed,
} from '@trinserhof/ui';
import { cleanupLegacyBookings, migrateBookingsToCustomers } from '@trinserhof/database';
import { CleanupBookingsResult, ExtractCustomersResult } from '@trinserhof/helpers';
import { ArrowLeftIcon, CalendarIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

type Status = 'idle' | 'previewing' | 'previewed' | 'applying' | 'applied' | 'error';

const Spinner = () => <CalendarIcon className="animate-spin" />;

/**
 * Generic migration card with a dry-run -> apply flow. `run(apply)` performs the
 * migration (read-only when `apply` is false); `renderResult` shows its outcome.
 */
function MigrationCard<T>({
  title,
  description,
  run,
  renderResult,
}: {
  title: string;
  description: string;
  run: (apply: boolean) => Promise<T>;
  renderResult: (result: T, mode: 'preview' | 'applied') => React.ReactNode;
}) {
  const [status, setStatus] = React.useState<Status>('idle');
  const [result, setResult] = React.useState<T | null>(null);
  const [mode, setMode] = React.useState<'preview' | 'applied'>('preview');

  const busy = status === 'previewing' || status === 'applying';
  const hasPreview = status === 'previewed' || status === 'applied';

  const execute = async (apply: boolean) => {
    setStatus(apply ? 'applying' : 'previewing');
    try {
      const next = await run(apply);
      setResult(next);
      setMode(apply ? 'applied' : 'preview');
      setStatus(apply ? 'applied' : 'previewed');
      if (apply) {
        toast.success(`${title}: changes applied.`);
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      toast.error(`${title}: ${error instanceof Error ? error.message : 'something went wrong.'}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {result !== null && <CardContent>{renderResult(result, mode)}</CardContent>}
      <CardFooter className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => execute(false)}
          className="hover:cursor-pointer"
        >
          {status === 'previewing' ? <Spinner /> : 'Preview (dry run)'}
        </Button>
        <Button
          disabled={busy || !hasPreview}
          onClick={() => execute(true)}
          className="hover:cursor-pointer"
        >
          {status === 'applying' ? <Spinner /> : 'Apply'}
        </Button>
        {status === 'applied' && <span className="text-xs text-muted-foreground">Done.</span>}
        {status === 'previewed' && (
          <span className="text-xs text-muted-foreground">Preview only — nothing written yet.</span>
        )}
      </CardFooter>
    </Card>
  );
}

const renderCustomerResult = (result: ExtractCustomersResult, mode: 'preview' | 'applied') => {
  const { summary, suggestions } = result;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="text-xs text-muted-foreground">
        {mode === 'applied' ? 'Applied changes:' : 'Would change:'}
      </div>
      <ul className="grid gap-1">
        <li>
          Bookings migrated: <strong>{summary.migratedCount}</strong>
        </li>
        <li>
          New customers created: <strong>{summary.newCustomersCount}</strong>
        </li>
        <li>
          Merged into existing customers: <strong>{summary.mergedCustomersCount}</strong>
        </li>
      </ul>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">
            {suggestions.length} possible duplicate customer pair(s) for manual review:
          </div>
          <ScrollArea className="h-48 rounded-md border p-2">
            <ul className="grid gap-2">
              {suggestions.map((s, i) => (
                <li key={i} className="border-b pb-2 last:border-b-0">
                  <div className="text-xs text-muted-foreground">{s.reason}</div>
                  {s.customers.map((c) => (
                    <div key={c.id} className="text-xs">
                      {c.name || '(no name)'} — {c.email}
                      {c.phone ? ` — ${c.phone}` : ''}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

const renderCleanupResult = (result: CleanupBookingsResult, mode: 'preview' | 'applied') => {
  const { summary, reviewFlags } = result;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="text-xs text-muted-foreground">
        {mode === 'applied' ? 'Applied changes:' : 'Would change:'}
      </div>
      <ul className="grid gap-1">
        <li>
          Total bookings: <strong>{summary.totalBookings}</strong>
        </li>
        <li>
          Bookings rewritten: <strong>{summary.changedCount}</strong>
        </li>
      </ul>

      {reviewFlags.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">
            {reviewFlags.length} change(s) worth a manual glance:
          </div>
          <ScrollArea className="h-48 rounded-md border p-2">
            <ul className="grid gap-2">
              {reviewFlags.map((f, i) => (
                <li key={i} className="border-b pb-2 last:border-b-0">
                  <div className="text-xs text-muted-foreground">Booking {f.bookingId}</div>
                  <div className="text-xs">{f.reason}</div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export const DataMigration = ({ isAdmin, onBack }: { isAdmin: boolean; onBack: () => void }) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={onBack}
          className="rounded-full hover:cursor-pointer"
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-lg font-semibold">Data Migration</h1>
      </div>

      {!isAdmin ? (
        <NoEditingAllowed />
      ) : (
        <>
          <MigrationCard<CleanupBookingsResult>
            title="Cleanup legacy bookings"
            description="Rewrites legacy bookings (old start/end/group/contact/content schema, or missing newer fields like channel/priceFixed/halbpension) onto the current schema. Run this first — it unblocks the migration below if it reports PERMISSION_DENIED. Safe to re-run — already up-to-date bookings are skipped."
            run={(apply) => cleanupLegacyBookings({ apply })}
            renderResult={renderCleanupResult}
          />
          <MigrationCard<ExtractCustomersResult>
            title="Extract customers from bookings"
            description="Creates a separate customers record for each booking (matched/merged by email) and links the booking to it. Safe to re-run — already-linked bookings are skipped. If this fails with PERMISSION_DENIED, run “Cleanup legacy bookings” above first."
            run={(apply) => migrateBookingsToCustomers({ apply })}
            renderResult={renderCustomerResult}
          />
        </>
      )}
    </div>
  );
};
