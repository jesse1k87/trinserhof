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
import { wipeBookingsAndCustomers } from '@trinserhof/database';
import { TrashIcon, UpdateIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { type Role } from '@trinserhof/types';

export const DataMigration = ({ role }: { role: Role }) => {
  const [wiping, setWiping] = React.useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = React.useState(false);

  const confirmWipe = async () => {
    setWiping(true);
    try {
      const { bookingsDeleted, customersDeleted } = await wipeBookingsAndCustomers();
      setWipeConfirmOpen(false);
      toast.success(`Deleted ${bookingsDeleted} booking(s) and ${customersDeleted} customer(s).`);
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
              Permanently deletes every booking and customer in the database. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={() => setWipeConfirmOpen(true)}
              className="gap-2 hover:cursor-pointer"
            >
              <TrashIcon />
              Delete all bookings &amp; customers
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog open={wipeConfirmOpen} onOpenChange={(open) => !wiping && setWipeConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all bookings and customers?</DialogTitle>
            <DialogDescription>
              This empties the bookings and customers nodes in the database entirely. This cannot be
              undone.
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
