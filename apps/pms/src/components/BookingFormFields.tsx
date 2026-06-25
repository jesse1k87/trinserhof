import * as React from 'react';
import { Booking, Customer, RoomId, User } from '@trinserhof/types';
import {
  formatCurrency,
  getNewCustomer,
  getStayPriceBreakdown,
  isValidEmailAddress,
} from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { BookingPartyFields } from '@trinserhof/ui/src/components/BookingPartyFields';
import useCustomers from 'src/hooks/useCustomers';
import usePrices from 'src/hooks/usePrices';
import useRooms from 'src/hooks/useRooms';
import { Input } from '@trinserhof/ui/src/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@trinserhof/ui/src/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@trinserhof/ui/src/components/popover';
import { logAuditEvent, saveCustomer } from '@trinserhof/database';
import { toast } from 'sonner';
import {
  ChevronsUpDown as CaretSortIcon,
  Check as CheckIcon,
  X as Cross2Icon,
  User as PersonIcon,
  Plus as PlusIcon,
} from 'lucide-react';

const getCustomerSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid customer data:')) {
    return `This customer could not be saved: ${error.message.replace('Invalid customer data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This customer is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the customer.';
};

// The customer-linking section, room picker, party fields and price breakdown shared by
// the booking-edit sheet and the new-booking page - they differ only in surrounding chrome
// (Sheet vs. full page) and in what happens when the user clicks through to a linked customer.
export const BookingFormFields = ({
  booking,
  onChange,
  user,
  enabled,
  onViewCustomer,
}: {
  booking: Booking;
  onChange: (booking: Booking) => void;
  user: User;
  enabled: boolean;
  onViewCustomer: (customer: Customer) => void;
}) => {
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false);
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [draftCustomer, setDraftCustomer] = React.useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = React.useState(false);

  const customers = useCustomers();
  const rooms = useRooms();
  const prices = usePrices();

  const linkedCustomers = customers.filter((c) => booking.customers?.includes(c.id));

  const toggleCustomer = (selected: Customer) => {
    const isLinked = booking.customers?.includes(selected.id);
    const nextCustomerIds = isLinked
      ? (booking.customers ?? []).filter((id) => id !== selected.id)
      : [...(booking.customers ?? []), selected.id];

    onChange({ ...booking, customers: nextCustomerIds });
  };

  const selectedRoom = rooms.find((room) => room.id === booking.roomId);
  const priceBreakdown = getStayPriceBreakdown(
    prices,
    selectedRoom?.type,
    booking.checkIn,
    booking.checkOut,
  );
  const nightCount = priceBreakdown.nights.length;
  // When the room type has no base price and no overrides, the total is a
  // meaningless 0 - show a dash and a hint to set prices instead.
  const hasKnownTotal = !(priceBreakdown.hasUnknownPrice && priceBreakdown.total === 0);

  return (
    <>
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
              onClick={() => onViewCustomer(c)}
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

        <Popover
          open={customerPickerOpen}
          onOpenChange={(open) => {
            setCustomerPickerOpen(open);
            if (!open) {
              setDraftCustomer(null);
              setCustomerSearch('');
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={customerPickerOpen}
              disabled={!enabled}
              className="justify-between hover:cursor-pointer"
            >
              Add customer to booking
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            {draftCustomer ? (
              <div className="flex flex-col gap-2 p-3">
                <div className="text-xs text-muted-foreground">New customer</div>
                <Input
                  placeholder="Name"
                  value={draftCustomer.name}
                  onChange={(event) =>
                    setDraftCustomer({ ...draftCustomer, name: event.target.value })
                  }
                />
                <Input
                  placeholder="E-mail (optional)"
                  value={draftCustomer.email ?? ''}
                  onChange={(event) =>
                    setDraftCustomer({ ...draftCustomer, email: event.target.value })
                  }
                />
                <Input
                  placeholder="Phone (optional)"
                  value={draftCustomer.phone ?? ''}
                  onChange={(event) =>
                    setDraftCustomer({ ...draftCustomer, phone: event.target.value })
                  }
                />
                <div className="flex flex-row justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setDraftCustomer(null)}>
                    Back
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      savingCustomer ||
                      !draftCustomer.name.trim() ||
                      Boolean(draftCustomer.email && !isValidEmailAddress(draftCustomer.email))
                    }
                    onClick={async () => {
                      setSavingCustomer(true);
                      try {
                        const saved = await saveCustomer(draftCustomer);
                        logAuditEvent('CUSTOMER_CREATED', user.email);

                        onChange({
                          ...booking,
                          customers: [...(booking.customers ?? []), saved.id],
                        });

                        setDraftCustomer(null);
                        setCustomerSearch('');
                        setCustomerPickerOpen(false);
                      } catch (error) {
                        toast.error(getCustomerSaveErrorMessage(error));
                      } finally {
                        setSavingCustomer(false);
                      }
                    }}
                  >
                    Create &amp; link
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Command>
                  <CommandInput
                    placeholder="Search customers…"
                    className="h-9"
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No customers found.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((c) => {
                        const isLinked = booking.customers?.includes(c.id);
                        return (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            keywords={[c.name, c.email ?? '', c.phone ?? '']}
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
                <div className="border-t p-1">
                  <button
                    type="button"
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:cursor-pointer"
                    onClick={() => {
                      const trimmed = customerSearch.trim();
                      setDraftCustomer({
                        ...getNewCustomer(),
                        ...(trimmed.includes('@') ? { email: trimmed } : { name: trimmed }),
                      });
                    }}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create new customer
                    {customerSearch.trim() && ` "${customerSearch.trim()}"`}
                  </button>
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>

        {linkedCustomers.length === 0 && (
          <div className="pt-1 text-xs text-muted-foreground">
            No customers linked yet — saving will create one from the e-mail below.
          </div>
        )}
      </div>

      <Select
        defaultValue={booking.roomId || undefined}
        disabled={!enabled}
        onValueChange={(newRoomId: RoomId) => {
          onChange({ ...booking, roomId: newRoomId });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a room" />
        </SelectTrigger>
        <SelectContent>
          {rooms.map(({ id }) => (
            <SelectItem key={id} value={id}>
              <div className="flex flex-col">
                <span>Room {id}</span>
                <span className="text-xs text-muted-foreground">{id}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <BookingPartyFields
        booking={booking}
        disabled={!enabled}
        onChange={(changes) => onChange({ ...booking, ...changes })}
      />

      <div className="flex flex-col w-full grid gap-1 rounded-md border p-3">
        <div className="flex flex-row items-center justify-between">
          <span className="text-sm">Total price</span>
          <span className="text-base font-semibold">
            {nightCount > 0 && hasKnownTotal ? formatCurrency(priceBreakdown.total) : '—'}
          </span>
        </div>
        {selectedRoom && nightCount > 0 ? (
          <div className="text-xs text-muted-foreground">
            {nightCount} {nightCount === 1 ? 'night' : 'nights'}
            {selectedRoom?.type ? ` · ${selectedRoom?.type}` : ''}
            {priceBreakdown.hasOverride && hasKnownTotal ? ' · includes night-specific prices' : ''}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {!selectedRoom
              ? 'Assign a room to calculate the price.'
              : 'Select a date range to calculate the price.'}
          </div>
        )}
        {nightCount > 0 && priceBreakdown.hasUnknownPrice && (
          <div className="text-xs text-destructive">
            {selectedRoom?.type
              ? `No base price set for ${selectedRoom?.type}. Set it on the Prices page.`
              : 'No base price set for this room type. Set it on the Prices page.'}
          </div>
        )}
      </div>
    </>
  );
};
