import * as React from 'react';
import { canPerform, User } from '@trinserhof/types';
import { RestaurantTableContext } from 'src/context/RestaurantTableContext';
import { restaurantTablesAreDifferent } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import { Input } from '@trinserhof/ui/src/components/input';
import { NumberPicker } from '@trinserhof/ui';
import useRestaurantTables from 'src/hooks/useRestaurantTables';
import { logAuditEvent, saveTable } from '@trinserhof/supabase-db';
import { toast } from 'sonner';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid table data:')) {
    return `This table could not be saved: ${error.message.replace('Invalid table data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This table is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the table.';
};

export const TableDetails = ({ user }: { user: User }) => {
  const [table, setTable] = React.useContext(RestaurantTableContext);

  const tables = useRestaurantTables();

  const originalTable = tables?.find((t) => t.id === table?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalTable);

  React.useEffect(() => {
    if (!table) return;
    setHasChanges(Boolean(!originalTable || restaurantTablesAreDifferent(originalTable, table)));
  }, [table, tables]);

  if (!table) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'TABLE', 'UPDATE');

  const handleSave = async () => {
    try {
      setTable(await saveTable(table));
      logAuditEvent(originalTable ? 'TABLE_UPDATED' : 'TABLE_CREATED', user.email);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && setTable(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Table details</SheetTitle>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Number</div>
          <Input
            type="number"
            placeholder="e.g. 1"
            value={table.number}
            disabled={!enabled}
            onChange={(event) => setTable({ ...table, number: Number(event.target.value) })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Area</div>
          <Input
            placeholder="e.g. Terrace"
            value={table.areaName}
            disabled={!enabled}
            onChange={(event) => setTable({ ...table, areaName: event.target.value })}
          />
        </div>

        <NumberPicker
          label="Max guests"
          sublabel="Maximum number of people"
          enabled={enabled}
          minAmount={1}
          maxAmount={20}
          initialAmount={table.maxGuests}
          onChange={(newValue: number) => setTable({ ...table, maxGuests: newValue })}
        />

        {enabled && (
          <div className="flex flex-row justify-between w-full">
            {hasChanges && (
              <div className="flex flex-row justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setTable(originalTable ?? null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
