import * as React from 'react';
import {
  canPerform,
  ROOM_AMENITIES,
  ROOM_BED_COUNTS,
  ROOM_TYPES,
  type RoomTypeId,
  User,
} from '@trinserhof/types';
import { RoomContext } from 'src/context/RoomContext';
import { roomsAreDifferent } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import useRooms from 'src/hooks/useRooms';
import { Input } from '@trinserhof/ui/src/components/input';
import { NumberPicker } from '@trinserhof/ui';
import { Checkbox } from '@trinserhof/ui/src/components/checkbox';
import { Label } from '@trinserhof/ui/src/components/label';
import { HorizontalLine } from '@trinserhof/ui/src/components/HorizontalLine';
import { logAuditEvent, saveRoom } from '@trinserhof/database';
import { NoEditingAllowed } from '@trinserhof/ui';
import { toast } from 'sonner';
import {
  ROOM_AMENITY_ICONS,
  ROOM_AMENITY_LABELS,
  ROOM_BED_COUNT_ICONS,
  ROOM_BED_COUNT_LABELS,
} from 'src/components/roomFeatureIcons';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid room data:')) {
    return `This room could not be saved: ${error.message.replace('Invalid room data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This room is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the room.';
};

export const RoomDetails = ({ user }: { user: User }) => {
  const [room, setRoom] = React.useContext(RoomContext);

  const rooms = useRooms();

  const originalRoom = rooms?.find((r) => r.id === room?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalRoom);

  React.useEffect(() => {
    if (!room) return;
    setHasChanges(Boolean(!originalRoom || roomsAreDifferent(originalRoom, room)));
  }, [room, rooms]);

  if (!room) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'ROOM', 'UPDATE');

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
              {ROOM_TYPES.map(({ type }) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <NumberPicker
          label="Max guests per night"
          disabled={!enabled}
          initialAmount={room.maxCustomers ?? 1}
          minAmount={1}
          onChange={(newValue: number) => setRoom({ ...room, maxCustomers: newValue })}
        />

        <HorizontalLine />

        <div className="flex flex-col w-full grid gap-2">
          <div className="text-xs text-muted-foreground">Beds &amp; spaces</div>
          <div className="flex flex-col gap-2">
            {ROOM_BED_COUNTS.map((bedCount) => {
              const Icon = ROOM_BED_COUNT_ICONS[bedCount];
              return (
                <NumberPicker
                  key={bedCount}
                  label={
                    <span className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      {ROOM_BED_COUNT_LABELS[bedCount]}
                    </span>
                  }
                  disabled={!enabled}
                  initialAmount={room[bedCount] ?? 0}
                  onChange={(newValue: number) => setRoom({ ...room, [bedCount]: newValue })}
                />
              );
            })}
          </div>
        </div>

        <HorizontalLine />

        <div className="flex flex-col w-full grid gap-2">
          <div className="text-xs text-muted-foreground">Amenities</div>
          <div className="grid grid-cols-2 gap-2">
            {ROOM_AMENITIES.map((amenity) => {
              const Icon = ROOM_AMENITY_ICONS[amenity];
              return (
                <Label key={amenity} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(room[amenity])}
                    disabled={!enabled}
                    onCheckedChange={(checked) => setRoom({ ...room, [amenity]: checked })}
                  />
                  <Icon className="size-4 text-muted-foreground" />
                  {ROOM_AMENITY_LABELS[amenity]}
                </Label>
              );
            })}
          </div>
        </div>

        {enabled && hasChanges && (
          <div className="flex flex-row justify-end w-full">
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
      </SheetContent>
    </Sheet>
  );
};
