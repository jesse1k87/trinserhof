import * as React from 'react';
import { canPerform, User } from '@trinserhof/types';
import { RoomTypeContext } from 'src/context/RoomTypeContext';
import { roomTypesAreDifferent } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import { Input } from '@trinserhof/ui/src/components/input';
import { Textarea } from '@trinserhof/ui/src/components/textarea';
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

export const RoomTypeDetails = ({ user }: { user: User }) => {
  const [roomType, setRoomType] = React.useContext(RoomTypeContext);

  const roomTypes = useRoomTypes();

  const originalRoomType = roomTypes?.find((r) => r.id === roomType?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalRoomType);

  React.useEffect(() => {
    if (!roomType) return;
    setHasChanges(Boolean(!originalRoomType || roomTypesAreDifferent(originalRoomType, roomType)));
  }, [roomType, roomTypes]);

  if (!roomType) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'ROOM_TYPE', 'UPDATE');

  const handleSave = async () => {
    const id = roomType.id.trim();
    if (!originalRoomType && roomTypes.some((r) => r.id === id)) {
      toast.error(`Room type ${id} already exists.`);
      return;
    }
    try {
      setRoomType(await saveRoomType({ ...roomType, id }));
      logAuditEvent(originalRoomType ? 'ROOM_TYPE_UPDATED' : 'ROOM_TYPE_CREATED', user.email);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && setRoomType(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Room type details</SheetTitle>

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

        {enabled && hasChanges && (
          <div className="flex flex-row justify-end w-full">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => setRoomType(originalRoomType ?? null)}
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
