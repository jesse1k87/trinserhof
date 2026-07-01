import * as React from 'react';
import { canPerform, Customer, RestaurantReservation, User } from '@trinserhof/types';
import {
  getNewRestaurantReservation,
  restaurantReservationsAreDifferent,
} from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import {
  Button,
  FormDateTimePicker,
  ICONS,
  NumberPicker,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui';
import useCustomers from 'src/hooks/useCustomers';
import useRestaurantTables from 'src/hooks/useRestaurantTables';
import { logAuditEvent, saveRestaurantReservation } from '@trinserhof/supabase';
import { toast } from 'sonner';
import useRestaurantReservations, {
  notifyReservationsChanged,
} from '../hooks/useRestaurantReservations';
import { CustomerSelect } from './CustomerSelect';

const NO_TABLE_VALUE = '__no_table__';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid table reservation data:')) {
    return `This table reservation could not be saved: ${error.message.replace('Invalid table reservation data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This table reservation is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the table reservation.';
};

export const RestaurantReservationDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const isNew = id === 'new';

  const restaurantReservations = useRestaurantReservations();
  const tables = useRestaurantTables();
  const customers = useCustomers();

  const originalRestaurantReservation = isNew
    ? undefined
    : restaurantReservations.find((reservation) => reservation.id === id);

  const [restaurantReservation, setRestaurantReservation] = React.useState<
    RestaurantReservation | undefined
  >(() => (isNew ? getNewRestaurantReservation() : undefined));

  React.useEffect(() => {
    if (!isNew) setRestaurantReservation(originalRestaurantReservation);
  }, [isNew, originalRestaurantReservation]);

  const canCreate = canPerform(user.role, 'TABLE_RESERVATION', 'CREATE');
  const canUpdate = canPerform(user.role, 'TABLE_RESERVATION', 'UPDATE');

  if (isNew && !canCreate) return null;
  if (!restaurantReservation) return <>404</>;

  const enabled = isNew ? canCreate : canUpdate;
  const hasChanges =
    isNew ||
    (!!originalRestaurantReservation &&
      restaurantReservationsAreDifferent(originalRestaurantReservation, restaurantReservation));

  const linkedCustomer = customers.find((c) => c.id === restaurantReservation.customerId);

  const selectCustomer = (selected: Customer) => {
    const isLinked = restaurantReservation.customerId === selected.id;
    setRestaurantReservation({
      ...restaurantReservation,
      customerId: isLinked ? undefined : selected.id,
    });
  };

  const handleSave = async () => {
    try {
      const saved = await saveRestaurantReservation(restaurantReservation);

      const updatedList = restaurantReservations.find((r) => r.id === saved.id)
        ? restaurantReservations.map((r) => (r.id === saved.id ? saved : r))
        : [...restaurantReservations, saved];

      notifyReservationsChanged(updatedList);

      logAuditEvent(
        originalRestaurantReservation ? 'TABLE_RESERVATION_UPDATED' : 'TABLE_RESERVATION_CREATED',
        user.email,
      );

      navigate('table-reservation-detail', saved.id);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center gap-2">
        <Button
          aria-label="Back to table reservations"
          className="hover:cursor-pointer"
          onClick={() => navigate('table-reservations-table')}
        >
          <ICONS.arrowLeft />
        </Button>
        <PageHeader
          icon={<ICONS.tableBooking className="size-5" />}
          title={isNew ? 'New table reservation' : 'Table reservation'}
        >
          {enabled && hasChanges && <Button onClick={handleSave}>Save</Button>}
        </PageHeader>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Guest</div>

        {!linkedCustomer ? (
          <CustomerSelect
            customers={customers}
            triggerLabel={`Add customer to reservation`}
            onSelect={(selected) => selectCustomer(selected)}
            user={user}
            enabled={enabled}
          />
        ) : (
          <div className="flex flex-row gap-2 items-center">
            <div className="flex-1 rounded-md border px-3 py-2 text-sm">
              {linkedCustomer.name || linkedCustomer.email}
              <div className="text-xs text-base-content/60">{linkedCustomer.email}</div>
            </div>
            <Button
              aria-label="View customer"
              className="hover:cursor-pointer"
              onClick={() => navigate('customer-detail', linkedCustomer.id)}
            >
              <ICONS.user />
            </Button>
            {enabled && (
              <Button
                aria-label="Remove customer"
                className="hover:cursor-pointer"
                onClick={() => selectCustomer(linkedCustomer)}
              >
                <ICONS.close />
              </Button>
            )}
          </div>
        )}
      </div>

      <NumberPicker
        label="Number of people"
        enabled={enabled}
        minAmount={1}
        maxAmount={50}
        initialAmount={restaurantReservation.numberOfPeople}
        onChange={(newValue: number) =>
          setRestaurantReservation({ ...restaurantReservation, numberOfPeople: newValue })
        }
      />

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Start</div>
        <FormDateTimePicker
          initialValue={new Date(restaurantReservation.start)}
          disabled={!enabled}
          onChange={(newStart) =>
            setRestaurantReservation({
              ...restaurantReservation,
              start: newStart.toISOString(),
            })
          }
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Table</div>
        <Select
          defaultValue={restaurantReservation.tableId || NO_TABLE_VALUE}
          disabled={!enabled}
          onValueChange={(newTableId: string) =>
            setRestaurantReservation({
              ...restaurantReservation,
              tableId: newTableId === NO_TABLE_VALUE ? undefined : newTableId,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="No table assigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_TABLE_VALUE}>No table assigned</SelectItem>
            {tables.map(({ id: tableId, number }) => (
              <SelectItem key={tableId} value={tableId}>
                {number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
