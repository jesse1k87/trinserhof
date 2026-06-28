import * as React from 'react';
import { canPerform, User } from '@trinserhof/types';
import { CustomerContext } from 'src/context/CustomerContext';
import { customersAreDifferent, formatDate } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import useCollection from 'src/hooks/useCollection';
import useCustomers from 'src/hooks/useCustomers';
import { Input } from '@trinserhof/ui/src/components/input';
import { HorizontalLine } from '@trinserhof/ui/src/components/HorizontalLine';
import { logAuditEvent, saveCustomer } from '@trinserhof/database';
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

export const CustomerDetails = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const [customer, setCustomer] = React.useContext(CustomerContext);

  const customers = useCustomers();
  const bookings = useCollection('bookings');

  const originalCustomer = customers?.find((c) => c.id === customer?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalCustomer);

  React.useEffect(() => {
    if (!customer) return;
    setHasChanges(Boolean(!originalCustomer || customersAreDifferent(originalCustomer, customer)));
  }, [customer, customers]);

  if (!customer) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'CUSTOMER', 'UPDATE');

  const customerBookings = bookings
    .filter((b) => b.customers?.includes(customer.id))
    .sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));

  return (
    <Sheet open onOpenChange={(open) => !open && setCustomer(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Customer details</SheetTitle>

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
                  onClick={() => {
                    setCustomer(null);
                    navigate('booking-detail', booking.id);
                  }}
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

        {canPerform(user.role, 'CUSTOMER', 'UPDATE') && (
          <div className="flex flex-row justify-between w-full">
            {hasChanges && (
              <div className="flex flex-row justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setCustomer(originalCustomer ?? null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setCustomer(await saveCustomer(customer));
                      logAuditEvent(
                        originalCustomer ? 'CUSTOMER_UPDATED' : 'CUSTOMER_CREATED',
                        user.email,
                      );
                    } catch (error) {
                      toast.error(getSaveErrorMessage(error));
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
