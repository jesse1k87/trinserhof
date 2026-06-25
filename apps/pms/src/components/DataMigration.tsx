import * as React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  PageHeader,
  ScrollArea,
} from '@trinserhof/ui';
import { importBookings, wipeBookingsAndCustomers } from '@trinserhof/database';
import { prepareBookingsForImport, type PreparedBookingImport } from '@trinserhof/helpers';
import { Trash2 as TrashIcon, RefreshCw as UpdateIcon, Upload as UploadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { canPerform, type Role } from '@trinserhof/types';

// How many skipped-record reasons to render before collapsing the rest into a count.
const MAX_SKIPPED_SHOWN = 50;

export const DataMigration = ({ role }: { role: Role }) => {
  const [wiping, setWiping] = React.useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [prepared, setPrepared] = React.useState<PreparedBookingImport | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  const canImport = canPerform(role, 'BOOKING', 'CREATE');

  const resetImport = () => {
    setPrepared(null);
    setParseError(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPrepared(null);
    setParseError(null);
    setFileName(file?.name ?? null);
    if (!file) return;

    setParsing(true);
    try {
      const parsed = JSON.parse(await file.text());
      setPrepared(prepareBookingsForImport(parsed));
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Could not read the file.');
    } finally {
      setParsing(false);
    }
  };

  const confirmImport = async () => {
    if (!prepared) return;
    setImporting(true);
    try {
      const result = await importBookings(prepared.bookings);
      setImportConfirmOpen(false);
      toast.success(
        `Imported ${result.imported} booking(s)${
          result.skipped.length > 0 ? `, skipped ${result.skipped.length}.` : '.'
        }`,
      );
      resetImport();
    } catch (error) {
      console.error(error);
      toast.error(
        `Import failed: ${error instanceof Error ? error.message : 'something went wrong.'}`,
      );
    } finally {
      setImporting(false);
    }
  };

  const confirmWipe = async () => {
    setWiping(true);
    try {
      const {
        bookingsDeleted,
        customersDeleted,
        tableReservationsDeleted,
        auditLogEntriesDeleted,
      } = await wipeBookingsAndCustomers();
      setWipeConfirmOpen(false);
      toast.success(
        `Deleted ${bookingsDeleted} booking(s), ${customersDeleted} customer(s), ${tableReservationsDeleted} table reservation(s), and ${auditLogEntriesDeleted} audit log entr${auditLogEntriesDeleted === 1 ? 'y' : 'ies'}.`,
      );
    } catch (error) {
      console.error(error);
      toast.error(
        `Delete failed: ${error instanceof Error ? error.message : 'something went wrong.'}`,
      );
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <PageHeader icon={<UpdateIcon className="size-5" />} title="Data migrations" />

      {canImport && (
        <Card>
          <CardHeader>
            <CardTitle>Import bookings</CardTitle>
            <CardDescription>
              Upload a JSON file with a Firebase-like structure (a <code>bookings</code> node, or
              just a map/array of booking objects). Each booking is written to the database under
              its id; an existing id is overwritten. Field names are mapped in code &mdash; adjust{' '}
              <code>BOOKING_IMPORT_FIELD_MAPPING</code> in{' '}
              <code>packages/helpers/src/bookingImport.ts</code> if your file uses different field
              names.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              disabled={parsing || importing}
              className="hover:cursor-pointer"
            />

            {parsing && <p className="text-sm text-muted-foreground">Reading {fileName}…</p>}

            {parseError && (
              <p className="text-sm text-destructive">Could not parse JSON: {parseError}</p>
            )}

            {prepared && (
              <div className="flex flex-col gap-2 text-sm">
                <p>
                  Found <strong>{prepared.total}</strong> record(s):{' '}
                  <strong>{prepared.bookings.length}</strong> ready to import
                  {prepared.invalid.length > 0 && (
                    <>
                      , <strong>{prepared.invalid.length}</strong> skipped
                    </>
                  )}
                  .
                </p>

                {prepared.invalid.length > 0 && (
                  <ScrollArea className="h-40 rounded-md border p-3">
                    <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {prepared.invalid.slice(0, MAX_SKIPPED_SHOWN).map((entry, index) => (
                        <li key={`${entry.id}-${index}`}>
                          <span className="font-mono">{entry.id}</span>: {entry.errors.join(', ')}
                        </li>
                      ))}
                      {prepared.invalid.length > MAX_SKIPPED_SHOWN && (
                        <li>…and {prepared.invalid.length - MAX_SKIPPED_SHOWN} more.</li>
                      )}
                    </ul>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              onClick={() => setImportConfirmOpen(true)}
              disabled={!prepared || prepared.bookings.length === 0 || parsing || importing}
              className="gap-2 hover:cursor-pointer"
            >
              <UploadIcon />
              {prepared ? `Import ${prepared.bookings.length} booking(s)` : 'Import bookings'}
            </Button>
            {prepared && (
              <Button
                variant="outline"
                onClick={resetImport}
                disabled={importing}
                className="hover:cursor-pointer"
              >
                Clear
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {role === 'OWNER' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Permanently deletes every booking, customer, table reservation, and audit log entry in
              the database. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={() => setWipeConfirmOpen(true)}
              className="gap-2 hover:cursor-pointer"
            >
              <TrashIcon />
              Delete all bookings, customers, table reservations &amp; audit log
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog
        open={importConfirmOpen}
        onOpenChange={(open) => !importing && setImportConfirmOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Import {prepared?.bookings.length ?? 0} booking(s) into the database?
            </DialogTitle>
            <DialogDescription>
              This writes the bookings to the database. Any booking whose id already exists will be
              overwritten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportConfirmOpen(false)}
              disabled={importing}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={confirmImport} disabled={importing} className="hover:cursor-pointer">
              {importing ? 'Importing…' : 'Yes, import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wipeConfirmOpen} onOpenChange={(open) => !wiping && setWipeConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete all bookings, customers, table reservations, and the audit log?
            </DialogTitle>
            <DialogDescription>
              This empties the bookings, customers, tableReservations, and auditLog nodes in the
              database entirely. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWipeConfirmOpen(false)}
              disabled={wiping}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmWipe}
              disabled={wiping}
              className="hover:cursor-pointer"
            >
              {wiping ? 'Deleting…' : 'Yes, delete everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
