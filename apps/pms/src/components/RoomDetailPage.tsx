import * as React from 'react';
import {
  canPerform,
  Room,
  ROOM_AMENITIES,
  ROOM_BED_COUNTS,
  type RoomTypeId,
  User,
} from '@trinserhof/types';
import { getNewRoom, roomsAreDifferent } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import {
  Button,
  Checkbox,
  ColorPicker,
  HorizontalLine,
  ICONS,
  Input,
  Label,
  NumberPicker,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui';
import useRooms from 'src/hooks/useRooms';
import useRoomTypes from 'src/hooks/useRoomTypes';
import useProperties from 'src/hooks/useProperties';
import { logAuditEvent, saveRoom } from '@trinserhof/supabase';
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

export const RoomDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const isNew = id === 'new';

  const rooms = useRooms();
  const roomTypes = useRoomTypes();
  const properties = useProperties();

  const originalRoom = isNew ? undefined : rooms.find((r) => r.id === id);

  const [room, setRoom] = React.useState<Room | undefined>(() =>
    isNew ? getNewRoom() : undefined,
  );

  React.useEffect(() => {
    if (!isNew) setRoom(originalRoom);
  }, [isNew, originalRoom]);

  // A new room has no property yet — assign it to the (single) property once
  // properties have loaded. The relation is mandatory, so a room can't be saved
  // without one.
  React.useEffect(() => {
    if (!isNew || properties.length === 0) return;
    setRoom((current) =>
      current && !current.propertyId ? { ...current, propertyId: properties[0].id } : current,
    );
  }, [isNew, properties]);

  React.useEffect(() => {
    if (!isNew && rooms.length > 0 && !originalRoom) {
      navigate('rooms-table');
    }
  }, [isNew, rooms.length, originalRoom, navigate]);

  const canCreate = canPerform(user.role, 'ROOM', 'CREATE');
  const canUpdate = canPerform(user.role, 'ROOM', 'UPDATE');

  if (isNew && !canCreate) return null;
  if (!room) return null;

  const enabled = isNew ? canCreate : canUpdate;
  const hasChanges = isNew || (!!originalRoom && roomsAreDifferent(originalRoom, room));

  const property = properties.find((p) => p.id === room.propertyId);

  const handleSave = async () => {
    const trimmedId = room.id.trim();
    if (!originalRoom && rooms.some((r) => r.id === trimmedId)) {
      toast.error(`Room ${trimmedId} already exists.`);
      return;
    }
    if (!room.propertyId) {
      toast.error('No property available to assign this room to.');
      return;
    }
    try {
      await saveRoom({ ...room, id: trimmedId });
      logAuditEvent(originalRoom ? 'ROOM_UPDATED' : 'ROOM_CREATED', user.email);
      if (isNew) navigate('rooms-table');
      else setRoom({ ...room, id: trimmedId });
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to rooms"
          className="hover:cursor-pointer"
          onClick={() => navigate('rooms-table')}
        >
          <ICONS.arrowLeft />
        </Button>
        <PageHeader icon={<ICONS.room className="size-5" />} title={isNew ? 'New room' : 'Room'}>
          {enabled && hasChanges && <Button onClick={handleSave}>Save</Button>}
        </PageHeader>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Room number</div>
        <Input
          placeholder="e.g. 125"
          value={room.id}
          disabled={!enabled || Boolean(originalRoom)}
          onChange={(event) => setRoom({ ...room, id: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Property</div>
        <Input value={property?.name ?? ''} disabled readOnly />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Type</div>
        <Select
          value={room.type}
          disabled={!enabled}
          onValueChange={(newType: RoomTypeId) => setRoom({ ...room, type: newType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roomTypes.map(({ id: typeId, label }) => (
              <SelectItem key={typeId} value={typeId}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <NumberPicker
        label="Max guests per night"
        enabled={enabled}
        initialAmount={room.maxCustomers ?? 1}
        minAmount={1}
        onChange={(newValue: number) => setRoom({ ...room, maxCustomers: newValue })}
      />

      <NumberPicker
        label="Floor"
        enabled={enabled}
        initialAmount={room.floor ?? 0}
        minAmount={0}
        maxAmount={20}
        onChange={(newValue: number) => setRoom({ ...room, floor: newValue })}
      />

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Color</div>
        <ColorPicker
          value={room.color}
          disabled={!enabled}
          onChange={(color) => setRoom({ ...room, color })}
        />
      </div>

      <HorizontalLine />

      <div className="flex flex-col w-full grid gap-2">
        <div className="text-xs text-base-content/60">Beds &amp; spaces</div>
        <div className="flex flex-col gap-2">
          {ROOM_BED_COUNTS.map((bedCount) => {
            const Icon = ROOM_BED_COUNT_ICONS[bedCount];
            return (
              <NumberPicker
                key={bedCount}
                label={
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 text-base-content/60" />
                    {ROOM_BED_COUNT_LABELS[bedCount]}
                  </span>
                }
                enabled={enabled}
                initialAmount={room[bedCount] ?? (bedCount === 'spaces' ? 1 : 0)}
                minAmount={bedCount === 'spaces' ? 1 : 0}
                onChange={(newValue: number) => setRoom({ ...room, [bedCount]: newValue })}
              />
            );
          })}
        </div>
      </div>

      <HorizontalLine />

      <div className="flex flex-col w-full grid gap-2">
        <div className="text-xs text-base-content/60">Amenities</div>
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
                <Icon className="size-4 text-base-content/60" />
                {ROOM_AMENITY_LABELS[amenity]}
              </Label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
