import * as React from 'react';
import {
  Booking,
  canUpdateReservations,
  CHANNELS,
  Customer,
  RoomId,
  Status,
  STATUSES,
  User,
} from '@trinserhof/types';
import { BookingContext } from 'src/context/BookingContext';
import { CustomerContext } from 'src/context/CustomerContext';
import {
  bookingsAreDifferent,
  calculatePrice,
  formatCurrency,
  resolveCustomerForEmail,
} from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/shadcn/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/shadcn/sheet';
import { BookingPartyFields } from '@trinserhof/ui/src/components/BookingPartyFields';
import useCollection from 'src/hooks/useCollection';
import useCustomers from 'src/hooks/useCustomers';
import useRooms from 'src/hooks/useRooms';
import { Input } from '@trinserhof/ui/src/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/shadcn/select';
import { Label } from '@trinserhof/ui/src/components/shadcn/label';
import { Checkbox } from '@trinserhof/ui/src/components/shadcn/checkbox';
import { HorizontalLine } from '@trinserhof/ui/src/components/HorizontalLine';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@trinserhof/ui/src/components/shadcn/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@trinserhof/ui/src/components/shadcn/popover';
import { logAuditEvent, saveBooking, saveCustomer } from '@trinserhof/database';
import { NoEditingAllowed } from '@trinserhof/ui';
import { toast } from 'sonner';
import { canDelete } from '@trinserhof/types/src/role';
import { CaretSortIcon, CheckIcon, Cross2Icon, PersonIcon } from '@radix-ui/react-icons';

const hasCustomPrice = (booking: Booking) => booking.priceFixed && booking.priceFixed !== '';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid booking data:')) {
    return `This booking could not be saved: ${error.message.replace('Invalid booking data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This booking is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the booking.';
};

export const BookingDetails = ({ user }: { user: User }) => {
  const [booking, setBooking] = React.useContext(BookingContext);
  const [, setCustomer] = React.useContext(CustomerContext);
  const [price, setPrice] = React.useState<number>(booking?.price ?? 0);
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false);

  const bookings = useCollection('bookings');
  const customers = useCustomers();
  const rooms = useRooms();

  const originalBooking = bookings?.find((b) => b?.id === booking?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalBooking);

  const checkForChanges = (booking: Booking) =>
    setHasChanges(
      Boolean(
        !originalBooking || (originalBooking && bookingsAreDifferent(originalBooking, booking)),
      ),
    );

  React.useEffect(() => {
    if (!booking) return;
    setPrice(calculatePrice(booking));
    checkForChanges(booking);
  }, [booking, bookings]);

  if (!booking) return null;

  if (!user) return null;

  const enabled = canUpdateReservations(user.role);

  const linkedCustomers = customers.filter((c) => booking.customers?.includes(c.id));

  // The first linked customer backs the legacy name/email/phone fields (used
  // for search, emails, and bookings with no linked customer at all).
  const toggleCustomer = (selected: Customer) => {
    const isLinked = booking.customers?.includes(selected.id);
    const nextCustomerIds = isLinked
      ? (booking.customers ?? []).filter((id) => id !== selected.id)
      : [...(booking.customers ?? []), selected.id];
    const primaryCustomer = customers.find((c) => c.id === nextCustomerIds[0]);

    setBooking({
      ...booking,
      customers: nextCustomerIds,
      name: primaryCustomer?.name ?? booking.name,
      email: primaryCustomer?.email ?? booking.email,
      phone: primaryCustomer?.phone ?? booking.phone,
    });
  };

  return (
    <Sheet open onOpenChange={(open) => !open && setBooking(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12 outline-none"
      >
        <SheetTitle className="sr-only">Booking details</SheetTitle>
        {!enabled && <NoEditingAllowed />}

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Customers</div>

          {linkedCustomers.map((c) => (
            <div key={c.id} className="flex flex-row gap-2 items-center">
              <div className="flex-1 rounded-md border px-3 py-2 text-sm">
                {c.name || c.email}
                <div className="text-xs text-muted-foreground">{c.email}</div>
              </div>
              <Button
                variant="outline"
                size="icon"
                aria-label="View customer"
                className="hover:cursor-pointer"
                onClick={() => {
                  setBooking(null);
                  setCustomer(c);
                }}
              >
                <PersonIcon />
              </Button>
              {enabled && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Remove customer"
                  className="hover:cursor-pointer"
                  onClick={() => toggleCustomer(c)}
                >
                  <Cross2Icon />
                </Button>
              )}
            </div>
          ))}

          <Popover open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerPickerOpen}
                disabled={!enabled}
                className="justify-between hover:cursor-pointer"
              >
                Add customer…
                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Search customers…" className="h-9" />
                <CommandList>
                  <CommandEmpty>No customers found.</CommandEmpty>
                  <CommandGroup>
                    {customers.map((c) => {
                      const isLinked = booking.customers?.includes(c.id);
                      return (
                        <CommandItem
                          key={c.id}
                          value={c.id}
                          keywords={[c.name, c.email, c.phone ?? '']}
                          onSelect={() => toggleCustomer(c)}
                        >
                          <div>
                            {c.name || c.email}
                            <div className="text-xs text-muted-foreground">{c.email}</div>
                          </div>
                          <CheckIcon
                            className={`ml-auto h-4 w-4 ${isLinked ? 'opacity-100' : 'opacity-0'}`}
                          />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {linkedCustomers.length === 0 && (
            <div className="pt-1 text-xs text-muted-foreground">
              No customers linked yet — saving will create one from the name/email below.
            </div>
          )}
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Name</div>
          <Input
            placeholder="Enter a name"
            value={booking.name}
            disabled={!enabled}
            onChange={(event) => setBooking({ ...booking, name: event.target.value })}
          />
        </div>

        <Select
          defaultValue={booking.roomId}
          disabled={!enabled}
          onValueChange={(newRoomId: RoomId) => {
            setBooking({ ...booking, roomId: newRoomId });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rooms.map(({ id, label, pricePerNight }) => (
              <SelectItem key={id} value={id}>
                Room {id}
                <div className="text-xs text-muted-foreground">
                  {label}
                  {enabled &&
                    typeof pricePerNight === 'number' &&
                    ` (${formatCurrency(pricePerNight, 0)} pro Nacht)`}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">E-mail</div>
          <Input
            placeholder="E-mail"
            value={booking.email}
            disabled={!enabled}
            onChange={(event) => setBooking({ ...booking, email: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Notes</div>
          <Input
            placeholder="Notes"
            value={booking.notes}
            disabled={!enabled}
            onChange={(event) => setBooking({ ...booking, notes: event.target.value })}
          />
        </div>

        {typeof booking.message === 'string' && booking.message !== '' && (
          <div className="flex flex-col w-full grid gap-1">
            <div className="pt-1 text-xs text-muted-foreground">Message</div>
            <div className="pt-1">{booking.message}</div>
          </div>
        )}

        <BookingPartyFields
          booking={booking}
          disabled={!enabled}
          onChange={(changes) => setBooking({ ...booking, ...changes })}
        />

        <div className="grid items-center justify-items-end gap-4 grid-cols-2">
          <div className="flex w-full flex-col">
            <Label htmlFor="halbpension">Halbpension</Label>
            <div className="pt-1 text-xs text-muted-foreground">Daily menu in the restaurant</div>
          </div>
          <Checkbox
            id="halbpension"
            disabled={!enabled}
            checked={booking.halbpension}
            onCheckedChange={(checked) => setBooking({ ...booking, halbpension: checked === true })}
          />
        </div>

        {user && (
          <div className="grid items-center justify-items-end gap-4 grid-cols-2">
            <div className="flex w-full">
              <Label className="font-semibold">Total price</Label>
            </div>
            <div className="flex flex-col text-right">
              {hasCustomPrice(booking) && (
                <s className="text-lg">{isNaN(price) ? price : formatCurrency(price)}</s>
              )}
              <div className="flex justify-end text-lg font-semibold">
                {hasCustomPrice(booking)
                  ? isNaN(Number(booking.priceFixed))
                    ? booking.priceFixed
                    : formatCurrency(Number(booking.priceFixed))
                  : isNaN(price)
                    ? price
                    : formatCurrency(price)}
              </div>
              <div className="flex justify-end text-xs">excl. VAT</div>
            </div>
          </div>
        )}

        <HorizontalLine />

        {enabled && (
          <div className="flex flex-col w-full grid gap-1">
            <div className="pt-1 text-xs text-muted-foreground">Custom price</div>
            <Input
              placeholder="&euro; ..."
              type="text"
              value={booking.priceFixed}
              disabled={false}
              onChange={(event) => setBooking({ ...booking, priceFixed: event.target.value })}
              className="flex w-full text-right"
            />
          </div>
        )}

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Status</div>
          <Select
            defaultValue={booking.status}
            disabled={!enabled}
            onValueChange={(newValue: Status) => setBooking({ ...booking, status: newValue })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className={`status-${status} flex flex-row items-center`}>
                    <div className="status-icon h-4 w-4 rounded-full mr-2"></div>
                    <div>
                      {(status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()).replaceAll(
                        '_',
                        ' ',
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Phone</div>
          <Input
            placeholder="Phone"
            value={booking.phone}
            disabled={!enabled}
            onChange={(event) => setBooking({ ...booking, phone: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Channel</div>
          <Select
            defaultValue={booking.channel}
            disabled={!enabled}
            onValueChange={(newChannel) => setBooking({ ...booking, channel: newChannel })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map(({ id, label }) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canDelete(user.role) && (
          <div className="flex flex-row justify-between w-full">
            <div>
              {booking.deleted ? (
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={async () => {
                    try {
                      setBooking(await saveBooking({ ...booking, deleted: false }));
                      logAuditEvent('BOOKING_RESTORED', user.email);
                    } catch (error) {
                      toast.error(getSaveErrorMessage(error));
                    }
                  }}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="mr-2"
                  onClick={async () => {
                    try {
                      setBooking(await saveBooking({ ...booking, deleted: true }));
                      logAuditEvent('BOOKING_DELETED', user.email);
                    } catch (error) {
                      toast.error(getSaveErrorMessage(error));
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
            {hasChanges && (
              <div className="flex flex-row justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setBooking(originalBooking ?? null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      let toSave = booking;

                      if (!toSave.customers?.length && toSave.email) {
                        const matchedCustomer = resolveCustomerForEmail(toSave.email, customers, {
                          name: toSave.name,
                          phone: toSave.phone,
                        });
                        if (!customers.some((c) => c.id === matchedCustomer.id)) {
                          await saveCustomer(matchedCustomer);
                          logAuditEvent('CUSTOMER_CREATED', user.email);
                        }
                        toSave = { ...toSave, customers: [matchedCustomer.id] };
                      }

                      setBooking(await saveBooking(toSave));
                      logAuditEvent(
                        originalBooking ? 'BOOKING_UPDATED' : 'BOOKING_CREATED',
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

        {user && (
          <div className="flex flex-row justify-center items-center content-center text-xs text-muted-foreground mt-4 grid gap-2">
            <div className="text-center">{booking.id}</div>
            {typeof booking.content === 'string' && booking.content !== '' && (
              <div className="text-center">{booking.content}</div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
