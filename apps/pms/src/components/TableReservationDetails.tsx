import * as React from 'react';
import { canPerform, User } from '@trinserhof/types';
import { TableReservationContext } from 'src/context/TableReservationContext';
import { tableReservationsAreDifferent } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import { Input } from '@trinserhof/ui/src/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import { NumberPicker } from '@trinserhof/ui';
import useTableReservations from 'src/hooks/useTableReservations';
import useTables from 'src/hooks/useTables';
import { deleteTableReservation, logAuditEvent, saveTableReservation } from '@trinserhof/database';
import { NoEditingAllowed } from '@trinserhof/ui';
import { toast } from 'sonner';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid table reservation data:')) {
    return `This table reservation could not be saved: ${error.message.replace('Invalid table reservation data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This table reservation is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the table reservation.';
};

const getDeleteErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to delete this table reservation.';
  }
  return 'Something went wrong while deleting the table reservation.';
};

// <input type="datetime-local"> works in local time with no timezone suffix,
// while the reservation stores a timezone-aware ISO string - convert at the edges.
const toLocalInputValue = (iso: string) => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromLocalInputValue = (value: string) => new Date(value).toISOString();

export const TableReservationDetails = ({ user }: { user: User }) => {
  const [tableReservation, setTableReservation] = React.useContext(TableReservationContext);

  const tableReservations = useTableReservations();
  const tables = useTables();

  const originalTableReservation = tableReservations?.find(
    (reservation) => reservation.id === tableReservation?.id,
  );

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalTableReservation);

  React.useEffect(() => {
    if (!tableReservation) return;
    setHasChanges(
      Boolean(
        !originalTableReservation ||
        tableReservationsAreDifferent(originalTableReservation, tableReservation),
      ),
    );
  }, [tableReservation, tableReservations]);

  if (!tableReservation) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'TABLE_RESERVATION', 'UPDATE');

  const handleSave = async () => {
    try {
      setTableReservation(await saveTableReservation(tableReservation));
      logAuditEvent(
        originalTableReservation ? 'TABLE_RESERVATION_UPDATED' : 'TABLE_RESERVATION_CREATED',
        user.email,
      );
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTableReservation(tableReservation.id);
      logAuditEvent('TABLE_RESERVATION_DELETED', user.email);
      setTableReservation(null);
    } catch (error) {
      toast.error(getDeleteErrorMessage(error));
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && setTableReservation(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Table reservation details</SheetTitle>
        {!enabled && <NoEditingAllowed />}

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Name</div>
          <Input
            placeholder="e.g. Smith"
            value={tableReservation.name}
            disabled={!enabled}
            onChange={(event) =>
              setTableReservation({ ...tableReservation, name: event.target.value })
            }
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Table</div>
          <Select
            defaultValue={tableReservation.tableId}
            disabled={!enabled}
            onValueChange={(newTableId: string) =>
              setTableReservation({ ...tableReservation, tableId: newTableId })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tables.map(({ id, number }) => (
                <SelectItem key={id} value={id}>
                  {number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Start</div>
          <Input
            type="datetime-local"
            value={toLocalInputValue(tableReservation.start)}
            disabled={!enabled}
            onChange={(event) =>
              setTableReservation({
                ...tableReservation,
                start: fromLocalInputValue(event.target.value),
              })
            }
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">End</div>
          <Input
            type="datetime-local"
            value={toLocalInputValue(tableReservation.end)}
            disabled={!enabled}
            onChange={(event) =>
              setTableReservation({
                ...tableReservation,
                end: fromLocalInputValue(event.target.value),
              })
            }
          />
        </div>

        <NumberPicker
          label="Number of people"
          disabled={!enabled}
          minAmount={1}
          maxAmount={50}
          initialAmount={tableReservation.numberOfPeople}
          onChange={(newValue: number) =>
            setTableReservation({ ...tableReservation, numberOfPeople: newValue })
          }
        />

        {enabled && (
          <div className="flex flex-row justify-between w-full">
            <div className="flex flex-col gap-1">
              {canPerform(user.role, 'TABLE_RESERVATION', 'DELETE') && originalTableReservation && (
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )}
            </div>
            {hasChanges && (
              <div className="flex flex-row justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setTableReservation(originalTableReservation ?? null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-row justify-center items-center content-center text-xs text-muted-foreground mt-4 grid gap-2">
          <div className="text-center">{tableReservation.id}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
