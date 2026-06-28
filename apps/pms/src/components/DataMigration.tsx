import * as React from 'react';
import {
  Button,
  Card,
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
  PageHeader,
} from '@trinserhof/ui';
import { wipeBookings, wipeCustomers } from '@trinserhof/supabase-db';

import { TrashIcon, UpdateIcon } from '@trinserhof/ui';
import { toast } from 'sonner';
import { type Role } from '@trinserhof/types';

export const DataMigration = ({ role, email }: { role: Role; email: string }) => {
  const [wiping, setWiping] = React.useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = React.useState(false);

  const confirmWipe = async () => {
    setWiping(true);
    try {
      const { bookingsDeleted, restaurantReservationsDeleted, auditLogEntriesDeleted } =
        await wipeBookings(email);
      const { customersDeleted } = await wipeCustomers(email);
      setWipeConfirmOpen(false);
      toast.success(
        `Deleted ${bookingsDeleted} booking(s), ${restaurantReservationsDeleted} table reservation(s), ${customersDeleted} customer(s), and ${auditLogEntriesDeleted} audit log entr${auditLogEntriesDeleted === 1 ? 'y' : 'ies'}.`,
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

      {role === 'OWNER' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Permanently deletes every booking, table reservation, customer, and audit log entry in
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
              Delete all bookings, table reservations, customers &amp; audit log
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog open={wipeConfirmOpen} onOpenChange={(open) => !wiping && setWipeConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete all bookings, table reservations, customers, and the audit log?
            </DialogTitle>
            <DialogDescription>
              This empties the bookings, restaurantReservations, customers, and auditLog nodes in
              the database entirely. This cannot be undone.
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
