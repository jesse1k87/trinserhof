import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ICONS,
  NoAccess,
  PageHeader,
} from '@trinserhof/ui';
import { canPerform, isOwner, type Entity, type User } from '@trinserhof/types';
import { wipeBookings, wipeCustomers, wipeRooms } from '@trinserhof/supabase';
import { toast } from 'sonner';

// A single destructive action: a labelled card with a button that opens a
// confirmation dialog before running `onConfirm` (one of the wipe* functions).
const WipeCard = ({
  title,
  body,
  confirmTitle,
  noun,
  enabled,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmTitle: string;
  noun: string;
  enabled: boolean;
  onConfirm: () => Promise<{ deleted: number }>;
}) => {
  const [open, setOpen] = React.useState(false);
  const [isWiping, setIsWiping] = React.useState(false);

  const handleConfirm = async () => {
    setIsWiping(true);
    try {
      const { deleted } = await onConfirm();
      toast.success(`Deleted ${deleted} ${noun}.`);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(`Something went wrong while deleting ${noun}.`);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-destructive/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{body}</span>
      </div>
      <Button
        variant="destructive"
        disabled={!enabled}
        onClick={() => setOpen(true)}
        className="shrink-0 hover:cursor-pointer"
      >
        <ICONS.wipeData />
        Wipe {noun}
      </Button>

      {open && (
        <Dialog open onOpenChange={(next) => !isWiping && setOpen(next)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmTitle}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                This permanently deletes all {noun}. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isWiping}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirm} disabled={isWiping}>
                {isWiping ? 'Deleting…' : `Delete all ${noun}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Owner-only "danger zone" for permanently wiping whole tables. Access is gated
// on the OWNER role; each button is additionally gated on the matching
// <ENTITY>:DELETE permission, and the wipe* functions re-check the owner role
// server-side.
export const WipeDataPage = ({ user }: { user: User }) => {
  if (!isOwner(user.role)) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-3xl px-4 py-6">
        <NoAccess />
      </div>
    );
  }

  const canDelete = (entity: Entity) => canPerform(user.role, entity, 'DELETE');

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl px-4 py-6">
      <PageHeader icon={<ICONS.wipeData className="size-5" />} title="Wipe data" />
      <p className="text-sm text-muted-foreground">
        These actions permanently delete every record in a table. They cannot be undone — use with
        care.
      </p>

      <div className="flex flex-col gap-3">
        <WipeCard
          title="Bookings"
          body="Delete every room reservation."
          confirmTitle="Delete all bookings?"
          noun="bookings"
          enabled={canDelete('BOOKING')}
          onConfirm={async () => ({
            deleted: (await wipeBookings(user.role, user.email)).bookingsDeleted,
          })}
        />
        <WipeCard
          title="Guests"
          body="Delete every guest (customer) record."
          confirmTitle="Delete all guests?"
          noun="customers"
          enabled={canDelete('CUSTOMER')}
          onConfirm={async () => ({
            deleted: (await wipeCustomers(user.role, user.email)).customersDeleted,
          })}
        />
        <WipeCard
          title="Rooms"
          body="Delete every room."
          confirmTitle="Delete all rooms?"
          noun="rooms"
          enabled={canDelete('ROOM')}
          onConfirm={async () => ({
            deleted: (await wipeRooms(user.role, user.email)).roomsDeleted,
          })}
        />
      </div>
    </div>
  );
};
