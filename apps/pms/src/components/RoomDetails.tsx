import * as React from 'react';
import { canPerform, ROOM_TYPES, type RoomTypeId, User } from '@trinserhof/types';
import { RoomContext } from 'src/context/RoomContext';
import { BookingContext } from 'src/context/BookingContext';
import { formatCurrency, formatDate, roomsAreDifferent } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import useCollection from 'src/hooks/useCollection';
import useRooms from 'src/hooks/useRooms';
import { Input } from '@trinserhof/ui/src/components/input';
import { HorizontalLine } from '@trinserhof/ui/src/components/HorizontalLine';
import { logAuditEvent, saveRoom, deleteRoom } from '@trinserhof/database';
import { NoEditingAllowed } from '@trinserhof/ui';
import { toast } from 'sonner';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid room data:')) {
    return `This room could not be saved: ${error.message.replace('Invalid room data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This room is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the room.';
};

const getDeleteErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.includes('bookings')) {
    return error.message;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to delete this room.';
  }
  return 'Something went wrong while deleting the room.';
};

export const RoomDetails = ({ user }: { user: User }) => {
  const [room, setRoom] = React.useContext(RoomContext);
  const [, setBooking] = React.useContext(BookingContext);

  const rooms = useRooms();
  const bookings = useCollection('bookings');

  const originalRoom = rooms?.find((r) => r.id === room?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalRoom);

  React.useEffect(() => {
    if (!room) return;
    setHasChanges(Boolean(!originalRoom || roomsAreDifferent(originalRoom, room)));
  }, [room, rooms]);

  if (!room) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'ROOM', 'UPDATE');

  const roomBookings = bookings
    .filter((b) => b.roomId === room.id)
    .sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));

  const handleSave = async () => {
    const id = room.id.trim();
    if (!originalRoom && rooms.some((r) => r.id === id)) {
      toast.error(`Room ${id} already exists.`);
      return;
    }
    try {
      setRoom(await saveRoom({ ...room, id }));
      logAuditEvent(originalRoom ? 'ROOM_UPDATED' : 'ROOM_CREATED', user.email);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoom(room.id);
      logAuditEvent('ROOM_DELETED', user.email);
      setRoom(null);
    } catch (error) {
      toast.error(getDeleteErrorMessage(error));
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && setRoom(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Room details</SheetTitle>
        {!enabled && <NoEditingAllowed />}

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Room number</div>
          <Input
            placeholder="e.g. 125"
            value={room.id}
            disabled={!enabled || Boolean(originalRoom)}
            onChange={(event) => setRoom({ ...room, id: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Type</div>
          <Select
            value={room.type}
            disabled={!enabled}
            onValueChange={(newType: RoomTypeId) => setRoom({ ...room, type: newType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map(({ type, label }) => (
                <SelectItem key={type} value={type}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Label</div>
          <Input
            placeholder="Enter a label"
            value={room.label}
            disabled={!enabled}
            onChange={(event) => setRoom({ ...room, label: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Description</div>
          <Input
            placeholder="Description"
            value={room.description}
            disabled={!enabled}
            onChange={(event) => setRoom({ ...room, description: event.target.value })}
          />
        </div>

        <HorizontalLine />

        <div className="flex flex-col w-full grid gap-2">
          <div className="text-xs text-muted-foreground">Bookings ({roomBookings.length})</div>
          {roomBookings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No bookings yet.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {roomBookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  className="flex flex-row justify-between items-center text-left text-sm rounded-md border px-3 py-2 hover:bg-muted hover:cursor-pointer"
                  onClick={() => {
                    setRoom(null);
                    setBooking(booking);
                  }}
                >
                  <span>
                    {booking.name || booking.email} &middot; {formatDate(new Date(booking.checkIn))}
                  </span>
                  <span className="text-muted-foreground">{formatCurrency(booking.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {enabled && (
          <div className="flex flex-row justify-between w-full">
            <div className="flex flex-col gap-1">
              {canPerform(user.role, 'ROOM', 'DELETE') && originalRoom && (
                <Button
                  variant="destructive"
                  disabled={roomBookings.length > 0}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
              {canPerform(user.role, 'ROOM', 'DELETE') && originalRoom && roomBookings.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Rooms with bookings can't be deleted.
                </div>
              )}
            </div>
            {hasChanges && (
              <div className="flex flex-row justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setRoom(originalRoom ?? null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            )}
          </div>
        )}

        {room.id && (
          <div className="flex flex-row justify-center items-center content-center text-xs text-muted-foreground mt-4 grid gap-2">
            <div className="text-center">Room {room.id}</div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
