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
  PageHeader,
  Spinner,
} from '@trinserhof/ui';
import { runAllMigrations, type RunAllMigrationsResult } from '@trinserhof/database';
import {
  CheckedOutResult,
  CleanupBookingsResult,
  ExtractCustomersResult,
  RoomSeedResult,
  StripCustomerDataResult,
} from '@trinserhof/helpers';
import { UpdateIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { type Role } from '@trinserhof/types';

type Status = 'idle' | 'running' | 'done' | 'error';

const renderCustomerResult = (result: ExtractCustomersResult) => {
  const { summary, suggestions } = result;
  return (
    <div className="flex flex-col gap-3 text-sm">
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

const renderCleanupResult = (result: CleanupBookingsResult) => {
  const { summary, reviewFlags } = result;
  return (
    <div className="flex flex-col gap-3 text-sm">
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

const renderCheckedOutResult = (result: CheckedOutResult) => {
  const { summary } = result;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <ul className="grid gap-1">
        <li>
          Total bookings: <strong>{summary.totalBookings}</strong>
        </li>
        <li>
          Marked checked-out: <strong>{summary.changedCount}</strong>
        </li>
        <li>
          From CONFIRMED: <strong>{summary.fromConfirmed}</strong>
        </li>
        <li>
          From PAID: <strong>{summary.fromPaid}</strong>
        </li>
      </ul>
    </div>
  );
};

const renderRoomSeedResult = (result: RoomSeedResult) => {
  const { summary } = result;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <ul className="grid gap-1">
        <li>
          Total rooms: <strong>{summary.totalRooms}</strong>
        </li>
        <li>
          Rooms written: <strong>{summary.changedCount}</strong>
        </li>
        <li>
          Bookings linked to a room: <strong>{summary.bookingsLinked}</strong>
        </li>
      </ul>
    </div>
  );
};

const renderStripCustomerDataResult = (result: StripCustomerDataResult) => {
  const { summary, reviewFlags } = result;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <ul className="grid gap-1">
        <li>
          Total bookings: <strong>{summary.totalBookings}</strong>
        </li>
        <li>
          Bookings stripped of customer data: <strong>{summary.changedCount}</strong>
        </li>
        <li>
          Skipped (customer data but no customer link):{' '}
          <strong>{summary.skippedUnlinkedCount}</strong>
        </li>
      </ul>

      {reviewFlags.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">
            {reviewFlags.length} booking(s) left untouched — review:
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

const renderResult = (result: RunAllMigrationsResult) => (
  <div className="flex flex-col gap-5">
    <div>
      <div className="text-xs font-medium mb-2">1. Cleanup legacy bookings</div>
      {renderCleanupResult(result.legacy.cleanup)}
    </div>
    <div>
      <div className="text-xs font-medium mb-2">2. Extract customers from bookings</div>
      {renderCustomerResult(result.legacy.extractCustomers)}
    </div>
    <div>
      <div className="text-xs font-medium mb-2">3. Mark past bookings checked-out</div>
      {renderCheckedOutResult(result.legacy.checkedOut)}
    </div>
    <div>
      <div className="text-xs font-medium mb-2">4. Seed rooms & link bookings</div>
      {renderRoomSeedResult(result.rooms)}
    </div>
    <div>
      <div className="text-xs font-medium mb-2">5. Strip customer data from bookings</div>
      {renderStripCustomerDataResult(result.stripCustomerData)}
    </div>
  </div>
);

export const DataMigration = ({ role }: { role: Role }) => {
  const [status, setStatus] = React.useState<Status>('idle');
  const [result, setResult] = React.useState<RunAllMigrationsResult | null>(null);

  const run = async () => {
    setStatus('running');
    try {
      const next = await runAllMigrations({ apply: true });
      setResult(next);
      setStatus('done');
      toast.success('Data migration: changes applied.');
    } catch (error) {
      console.error(error);
      setStatus('error');
      toast.error(
        `Data migration: ${error instanceof Error ? error.message : 'something went wrong.'}`,
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <PageHeader icon={<UpdateIcon className="size-5" />} title="Data migrations" />

      {role !== 'OWNER' ? (
        <NoEditingAllowed />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Run migration</CardTitle>
            <CardDescription>
              Runs every data migration as a single step, in order: rewrites legacy bookings onto
              the current schema, creates/links a customers record for each booking, marks past
              CONFIRMED/PAID bookings as checked-out, seeds the rooms node and links bookings to
              their room, then strips the now-redundant customer fields off bookings. Safe to re-run
              — already up-to-date data is skipped at each step.
            </CardDescription>
          </CardHeader>
          {result !== null && <CardContent>{renderResult(result)}</CardContent>}
          <CardFooter className="flex flex-wrap items-center gap-2">
            <Button disabled={status === 'running'} onClick={run} className="hover:cursor-pointer">
              {status === 'running' ? <Spinner /> : 'Run migration'}
            </Button>
            {status === 'done' && <span className="text-xs text-muted-foreground">Done.</span>}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
