import * as React from 'react';
import { canPerform, Customer, User } from '@trinserhof/types';
import { customersAreDifferent, formatDate, getNewCustomer } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import {
  ArrowLeftIcon,
  Button,
  HorizontalLine,
  Input,
  PageHeader,
  UserIcon as PersonIcon,
} from '@trinserhof/ui';
import useCollection from 'src/hooks/useCollection';
import useCustomers from 'src/hooks/useCustomers';
import { logAuditEvent, saveCustomer } from '@trinserhof/supabase';
import { toast } from 'sonner';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid customer data:')) {
    return `This customer could not be saved: ${error.message.replace('Invalid customer data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This customer is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the customer.';
};

export const CustomerDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const isNew = id === 'new';

  const customers = useCustomers();
  const bookings = useCollection('bookings');

  const originalCustomer = isNew ? undefined : customers.find((c) => c.id === id);

  const [customer, setCustomer] = React.useState<Customer | undefined>(() =>
    isNew ? getNewCustomer() : undefined,
  );

  React.useEffect(() => {
    if (!isNew) setCustomer(originalCustomer);
  }, [isNew, originalCustomer]);

  React.useEffect(() => {
    if (!isNew && customers.length > 0 && !originalCustomer) {
      navigate('customers-table');
    }
  }, [isNew, customers.length, originalCustomer, navigate]);

  const canCreate = canPerform(user.role, 'CUSTOMER', 'CREATE');
  const canUpdate = canPerform(user.role, 'CUSTOMER', 'UPDATE');

  if (isNew && !canCreate) return null;
  if (!customer) return null;

  const enabled = isNew ? canCreate : canUpdate;
  const hasChanges =
    isNew || (!!originalCustomer && customersAreDifferent(originalCustomer, customer));

  const customerBookings = bookings
    .filter((b) => b.customers?.includes(customer.id))
    .sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));

  const handleSave = async () => {
    try {
      const saved = await saveCustomer(customer);
      logAuditEvent(originalCustomer ? 'CUSTOMER_UPDATED' : 'CUSTOMER_CREATED', user.email);
      if (isNew) navigate('customers-table');
      else setCustomer(saved);
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
          aria-label="Back to customers"
          className="hover:cursor-pointer"
          onClick={() => navigate('customers-table')}
        >
          <ArrowLeftIcon />
        </Button>
        <PageHeader
          icon={<PersonIcon className="size-5" />}
          title={isNew ? 'New customer' : 'Customer'}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Name</div>
        <Input
          placeholder="Enter a name"
          value={customer.name}
          disabled={!enabled}
          onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Surname</div>
        <Input
          placeholder="Enter a surname"
          value={customer.surname ?? ''}
          disabled={!enabled}
          onChange={(event) => setCustomer({ ...customer, surname: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">E-mail</div>
        <Input
          placeholder="E-mail"
          value={customer.email ?? ''}
          disabled={!enabled}
          onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Phone</div>
        <Input
          placeholder="Phone"
          value={customer.phone ?? ''}
          disabled={!enabled}
          onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Date of birth</div>
        <Input
          type="date"
          value={customer.dateOfBirth ?? ''}
          disabled={!enabled}
          onChange={(event) => setCustomer({ ...customer, dateOfBirth: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Nationality</div>
        <Input
          placeholder="Nationality"
          value={customer.nationality ?? ''}
          disabled={!enabled}
          onChange={(event) => setCustomer({ ...customer, nationality: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Language</div>
        <Input
          placeholder="Language"
          value={customer.language ?? ''}
          disabled={!enabled}
          onChange={(event) => setCustomer({ ...customer, language: event.target.value })}
        />
      </div>

      <HorizontalLine />

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col w-full grid gap-1 col-span-2">
          <div className="pt-1 text-xs text-muted-foreground">Street</div>
          <Input
            placeholder="Street"
            value={customer.street ?? ''}
            disabled={!enabled}
            onChange={(event) => setCustomer({ ...customer, street: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Number</div>
          <Input
            placeholder="No."
            value={customer.streetNumber ?? ''}
            disabled={!enabled}
            onChange={(event) => setCustomer({ ...customer, streetNumber: event.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Postcode</div>
          <Input
            placeholder="Postcode"
            value={customer.postcode ?? ''}
            disabled={!enabled}
            onChange={(event) => setCustomer({ ...customer, postcode: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1 col-span-2">
          <div className="pt-1 text-xs text-muted-foreground">City</div>
          <Input
            placeholder="City"
            value={customer.city ?? ''}
            disabled={!enabled}
            onChange={(event) => setCustomer({ ...customer, city: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Country</div>
        <Input
          placeholder="Country"
          value={customer.country ?? ''}
          disabled={!enabled}
          onChange={(event) => setCustomer({ ...customer, country: event.target.value })}
        />
      </div>

      <HorizontalLine />

      <div className="flex flex-col w-full grid gap-2">
        <div className="text-xs text-muted-foreground">Bookings ({customerBookings.length})</div>
        {customerBookings.length === 0 ? (
          <div className="text-sm text-muted-foreground">No bookings yet.</div>
        ) : (
          <div className="flex flex-col gap-1">
            {customerBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                className="flex flex-row justify-between items-center text-left text-sm rounded-md border px-3 py-2 hover:bg-muted hover:cursor-pointer"
                onClick={() => navigate('booking-detail', booking.id)}
              >
                <span>
                  Room {booking.roomId} &middot; {formatDate(new Date(booking.checkIn))}
                </span>
                <span className="text-muted-foreground">{booking.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {enabled && hasChanges && (
        <div className="flex flex-row justify-end w-full">
          <Button onClick={handleSave}>Save</Button>
        </div>
      )}
    </div>
  );
};
