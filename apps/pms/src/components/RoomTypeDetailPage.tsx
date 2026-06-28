import * as React from 'react';
import { canPerform, RoomType, User } from '@trinserhof/types';
import { getNewRoomType, roomTypesAreDifferent } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import { ArrowLeftIcon, BedIcon, Button, Input, PageHeader, Textarea } from '@trinserhof/ui';
import useRoomTypes from 'src/hooks/useRoomTypes';
import { logAuditEvent, saveRoomType } from '@trinserhof/supabase';
import { toast } from 'sonner';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid room type data:')) {
    return `This room type could not be saved: ${error.message.replace('Invalid room type data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This room type is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the room type.';
};

export const RoomTypeDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const isNew = id === 'new';

  const roomTypes = useRoomTypes();

  const originalRoomType = isNew ? undefined : roomTypes.find((r) => r.id === id);

  const [roomType, setRoomType] = React.useState<RoomType | undefined>(() =>
    isNew ? getNewRoomType() : undefined,
  );

  React.useEffect(() => {
    if (!isNew) setRoomType(originalRoomType);
  }, [isNew, originalRoomType]);

  React.useEffect(() => {
    if (!isNew && roomTypes.length > 0 && !originalRoomType) {
      navigate('room-types-table');
    }
  }, [isNew, roomTypes.length, originalRoomType, navigate]);

  const canCreate = canPerform(user.role, 'ROOM_TYPE', 'CREATE');
  const canUpdate = canPerform(user.role, 'ROOM_TYPE', 'UPDATE');

  if (isNew && !canCreate) return null;
  if (!roomType) return null;

  const enabled = isNew ? canCreate : canUpdate;
  const hasChanges =
    isNew || (!!originalRoomType && roomTypesAreDifferent(originalRoomType, roomType));

  const handleSave = async () => {
    const trimmedId = roomType.id.trim();
    if (!originalRoomType && roomTypes.some((r) => r.id === trimmedId)) {
      toast.error(`Room type ${trimmedId} already exists.`);
      return;
    }
    try {
      const saved = await saveRoomType({ ...roomType, id: trimmedId });
      logAuditEvent(originalRoomType ? 'ROOM_TYPE_UPDATED' : 'ROOM_TYPE_CREATED', user.email);
      if (isNew) navigate('room-types-table');
      else setRoomType(saved);
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
          aria-label="Back to room types"
          className="hover:cursor-pointer"
          onClick={() => navigate('room-types-table')}
        >
          <ArrowLeftIcon />
        </Button>
        <PageHeader
          icon={<BedIcon className="size-5" />}
          title={isNew ? 'New room type' : 'Room type'}
        >
          {enabled && hasChanges && <Button onClick={handleSave}>Save</Button>}
        </PageHeader>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Code</div>
        <Input
          placeholder="e.g. DELUXE"
          value={roomType.id}
          disabled={!enabled || Boolean(originalRoomType)}
          onChange={(event) => setRoomType({ ...roomType, id: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Name</div>
        <Input
          placeholder="Enter a name"
          value={roomType.label}
          disabled={!enabled}
          onChange={(event) => setRoomType({ ...roomType, label: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Description</div>
        <Textarea
          placeholder="Enter a description"
          value={roomType.description ?? ''}
          disabled={!enabled}
          onChange={(event) => setRoomType({ ...roomType, description: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Base price per night</div>
        <Input
          type="number"
          min={0}
          placeholder="e.g. 149"
          value={Number.isNaN(roomType.basePrice) ? '' : roomType.basePrice}
          disabled={!enabled}
          onChange={(event) => setRoomType({ ...roomType, basePrice: event.target.valueAsNumber })}
        />
      </div>
    </div>
  );
};
