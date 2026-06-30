import * as React from 'react';
import { canPerform, RestaurantTable, User } from '@trinserhof/types';
import { getNewTable, restaurantTablesAreDifferent } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import { Button, ICONS, Input, NumberPicker, PageHeader } from '@trinserhof/ui';
import useRestaurantTables from 'src/hooks/useRestaurantTables';
import { logAuditEvent, saveTable } from '@trinserhof/supabase';
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

export const TableDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const isNew = id === 'new';

  const tables = useRestaurantTables();

  const originalTable = isNew ? undefined : tables.find((t) => t.id === id);

  const [table, setTable] = React.useState<RestaurantTable | undefined>(() =>
    isNew ? getNewTable() : undefined,
  );

  React.useEffect(() => {
    if (!isNew) setTable(originalTable);
  }, [isNew, originalTable]);

  React.useEffect(() => {
    if (!isNew && tables.length > 0 && !originalTable) {
      navigate('tables-table');
    }
  }, [isNew, tables.length, originalTable, navigate]);

  const canCreate = canPerform(user.role, 'TABLE', 'CREATE');
  const canUpdate = canPerform(user.role, 'TABLE', 'UPDATE');

  if (isNew && !canCreate) return null;
  if (!table) return null;

  const enabled = isNew ? canCreate : canUpdate;
  const hasChanges =
    isNew || (!!originalTable && restaurantTablesAreDifferent(originalTable, table));

  const handleSave = async () => {
    try {
      const saved = await saveTable(table);
      logAuditEvent(originalTable ? 'TABLE_UPDATED' : 'TABLE_CREATED', user.email);
      if (isNew) navigate('tables-table');
      else setTable(saved);
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
          aria-label="Back to tables"
          className="hover:cursor-pointer"
          onClick={() => navigate('tables-table')}
        >
          <ICONS.arrowLeft />
        </Button>
        <PageHeader
          icon={<ICONS.table className="size-5" />}
          title={isNew ? 'New table' : 'Table'}
        >
          {enabled && hasChanges && <Button onClick={handleSave}>Save</Button>}
        </PageHeader>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Number</div>
        <Input
          type="number"
          placeholder="e.g. 1"
          value={table.number}
          disabled={!enabled}
          onChange={(event) => setTable({ ...table, number: Number(event.target.value) })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Area</div>
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
    </div>
  );
};
