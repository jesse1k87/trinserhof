import * as React from 'react';
import { Booking, Customer, PRICE_PET_PER_NIGHT, RoomId, User } from '@trinserhof/types';
import {
  formatCurrency,
  getCityTax,
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
  mode,
}: {
  booking: Booking;
  onChange: (booking: Booking) => void;
  user: User;
  enabled: boolean;
  onViewCustomer: (customer: Customer) => void;
  mode: 'create' | 'update';
}) => {
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false);
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [draftCustomer, setDraftCustomer] = React.useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = React.useState(false);

  const [additionalPickerOpen, setAdditionalPickerOpen] = React.useState(false);
  const [additionalSearch, setAdditionalSearch] = React.useState('');
  const [draftAdditionalCustomer, setDraftAdditionalCustomer] = React.useState<Customer | null>(
    null,
  );
  const [savingAdditionalCustomer, setSavingAdditionalCustomer] = React.useState(false);

  const customers = useCustomers();
  const rooms = useRooms();
  const prices = usePrices();

  const primaryCustomerId = booking.customers?.[0];
  const primaryCustomer = customers.find((c) => c.id === primaryCustomerId);
  const additionalCustomerIds = booking.customers?.slice(1) ?? [];
  const additionalCustomers = customers.filter((c) => additionalCustomerIds.includes(c.id));

  const setPrimaryCustomer = (selected: Customer | null) => {
    const rest = additionalCustomerIds.filter((id) => id !== selected?.id);
    onChange({ ...booking, customers: selected ? [selected.id, ...rest] : rest });
  };

  const toggleAdditionalCustomer = (selected: Customer) => {
    const isLinked = additionalCustomerIds.includes(selected.id);
    const nextRest = isLinked
      ? additionalCustomerIds.filter((id) => id !== selected.id)
      : [...additionalCustomerIds, selected.id];

    onChange({
      ...booking,
      customers: primaryCustomerId ? [primaryCustomerId, ...nextRest] : nextRest,
    });
  };

  const selectedRoom = rooms.find((room) => room.id === booking.roomId);
  const priceBreakdown = getStayPriceBreakdown(
    prices,
    selectedRoom?.type,
    booking.checkIn,
    booking.checkOut,
  );
  const nightCount = priceBreakdown.nights.length;

  // The booking stores its own pricePerNight (editable below) rather than always
  // recomputing from the room type's base price/overrides, which can change later.
  // Seed it from the resolved price the first time a room with a known price is picked.
  React.useEffect(() => {
    if (booking.pricePerNight === undefined && priceBreakdown.nights[0]?.price !== undefined) {
      onChange({ ...booking, pricePerNight: priceBreakdown.nights[0].price });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.type, priceBreakdown.nights[0]?.price]);

  const total =
    booking.pricePerNight !== undefined ? booking.pricePerNight * nightCount : undefined;
  const cityTax = getCityTax(booking, nightCount);
  const petsCost = booking.pets * nightCount * PRICE_PET_PER_NIGHT;
  const tax = total !== undefined ? (total + petsCost) * 0.1 : undefined;
  const grossTotal =
    total !== undefined ? total + petsCost + (tax ?? 0) + cityTax : undefined;

  return (
    <>
      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Customer</div>

        {primaryCustomer && (
          <div className="flex flex-row gap-2 items-center">
            <div className="flex-1 rounded-md border px-3 py-2 text-sm">
              {primaryCustomer.name || primaryCustomer.email}
              <div className="text-xs text-muted-foreground">{primaryCustomer.email}</div>
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="View customer"
              className="hover:cursor-pointer"
              onClick={() => onViewCustomer(primaryCustomer)}
            >
              <PersonIcon />
            </Button>
            {enabled && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Remove customer"
                className="hover:cursor-pointer"
                onClick={() => setPrimaryCustomer(null)}
              >
                <Cross2Icon />
              </Button>
            )}
          </div>
        )}

        {!primaryCustomer && (
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
                Select customer
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

                          setPrimaryCustomer(saved);

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
                        {customers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            keywords={[c.name, c.email ?? '', c.phone ?? '']}
                            onSelect={() => {
                              setPrimaryCustomer(c);
                              setCustomerPickerOpen(false);
                            }}
                          >
                            <div>
                              {c.name || c.email}
                              <div className="text-xs text-muted-foreground">{c.email}</div>
                            </div>
                          </CommandItem>
                        ))}
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
        )}
      </div>

      <BookingPartyFields
        booking={booking}
        disabled={!enabled}
        maxCustomers={selectedRoom?.maxCustomers}
        onChange={(changes) => onChange({ ...booking, ...changes })}
      />

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
          {rooms.map(({ id, type }) => {
            const roomPrice = prices.base[type];
            return (
              <SelectItem key={id} value={id}>
                <div className="flex flex-col">
                  <span>
                    Room {id} · {type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {roomPrice !== undefined ? `${formatCurrency(roomPrice)} / night` : 'No price set'}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div className="flex flex-col w-full grid gap-1 rounded-md border p-3">
        <div className="flex flex-row items-center justify-between">
          <span className="text-sm">
            {nightCount > 0
              ? `${nightCount} ${nightCount === 1 ? 'night' : 'nights'} x ${
                  booking.pricePerNight !== undefined ? formatCurrency(booking.pricePerNight) : '—'
                }`
              : 'Net price'}
          </span>
          <span className="text-base font-semibold">
            {nightCount > 0 && total !== undefined ? formatCurrency(total) : '—'}
          </span>
        </div>
        {nightCount > 0 && booking.pets > 0 && (
          <div className="flex flex-row items-center justify-between">
            <span className="text-sm">
              {booking.pets} {booking.pets === 1 ? 'pet' : 'pets'} x{' '}
              {formatCurrency(PRICE_PET_PER_NIGHT)}
            </span>
            <span className="text-sm">{formatCurrency(petsCost)}</span>
          </div>
        )}
        {nightCount > 0 && (
          <div className="flex flex-row items-center justify-between">
            <span className="text-sm">Tax (10%)</span>
            <span className="text-sm">{tax !== undefined ? formatCurrency(tax) : '—'}</span>
          </div>
        )}
        {nightCount > 0 && (
          <div className="flex flex-row items-center justify-between">
            <span className="text-sm">City tax</span>
            <span className="text-sm">{formatCurrency(cityTax)}</span>
          </div>
        )}
        {nightCount > 0 && (
          <div className="flex flex-row items-center justify-between pt-1">
            <span className="text-sm">Gross total</span>
            <span className="text-base font-semibold">
              {grossTotal !== undefined ? formatCurrency(grossTotal) : '—'}
            </span>
          </div>
        )}
        {selectedRoom && nightCount > 0 ? (
          <div className="text-xs text-muted-foreground">
            {nightCount} {nightCount === 1 ? 'night' : 'nights'}
            {selectedRoom?.type ? ` · ${selectedRoom?.type}` : ''}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {!selectedRoom
              ? 'Assign a room to calculate the price.'
              : 'Select a date range to calculate the price.'}
          </div>
        )}
        {nightCount > 0 && booking.pricePerNight === undefined && priceBreakdown.hasUnknownPrice && (
          <div className="text-xs text-destructive">
            {selectedRoom?.type
              ? `No base price set for ${selectedRoom?.type}. Set it on the Prices page, or enter a price per night above.`
              : 'No base price set for this room type. Set it on the Prices page, or enter a price per night above.'}
          </div>
        )}
      </div>

      {mode === 'update' && (
        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Additional customers</div>

          {additionalCustomers.map((c) => (
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
                  onClick={() => toggleAdditionalCustomer(c)}
                >
                  <Cross2Icon />
                </Button>
              )}
            </div>
          ))}

          <Popover
            open={additionalPickerOpen}
            onOpenChange={(open) => {
              setAdditionalPickerOpen(open);
              if (!open) {
                setDraftAdditionalCustomer(null);
                setAdditionalSearch('');
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={additionalPickerOpen}
                disabled={!enabled}
                className="justify-between hover:cursor-pointer"
              >
                Add customer to booking
                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              {draftAdditionalCustomer ? (
                <div className="flex flex-col gap-2 p-3">
                  <div className="text-xs text-muted-foreground">New customer</div>
                  <Input
                    placeholder="Name"
                    value={draftAdditionalCustomer.name}
                    onChange={(event) =>
                      setDraftAdditionalCustomer({
                        ...draftAdditionalCustomer,
                        name: event.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="E-mail (optional)"
                    value={draftAdditionalCustomer.email ?? ''}
                    onChange={(event) =>
                      setDraftAdditionalCustomer({
                        ...draftAdditionalCustomer,
                        email: event.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Phone (optional)"
                    value={draftAdditionalCustomer.phone ?? ''}
                    onChange={(event) =>
                      setDraftAdditionalCustomer({
                        ...draftAdditionalCustomer,
                        phone: event.target.value,
                      })
                    }
                  />
                  <div className="flex flex-row justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDraftAdditionalCustomer(null)}
                    >
                      Back
                    </Button>
                    <Button
                      size="sm"
                      disabled={
                        savingAdditionalCustomer ||
                        !draftAdditionalCustomer.name.trim() ||
                        Boolean(
                          draftAdditionalCustomer.email &&
                            !isValidEmailAddress(draftAdditionalCustomer.email),
                        )
                      }
                      onClick={async () => {
                        setSavingAdditionalCustomer(true);
                        try {
                          const saved = await saveCustomer(draftAdditionalCustomer);
                          logAuditEvent('CUSTOMER_CREATED', user.email);

                          onChange({
                            ...booking,
                            customers: [
                              ...(primaryCustomerId ? [primaryCustomerId] : []),
                              ...additionalCustomerIds,
                              saved.id,
                            ],
                          });

                          setDraftAdditionalCustomer(null);
                          setAdditionalSearch('');
                          setAdditionalPickerOpen(false);
                        } catch (error) {
                          toast.error(getCustomerSaveErrorMessage(error));
                        } finally {
                          setSavingAdditionalCustomer(false);
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
                      value={additionalSearch}
                      onValueChange={setAdditionalSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        {customers
                          .filter((c) => c.id !== primaryCustomerId)
                          .map((c) => {
                            const isLinked = additionalCustomerIds.includes(c.id);
                            return (
                              <CommandItem
                                key={c.id}
                                value={c.id}
                                keywords={[c.name, c.email ?? '', c.phone ?? '']}
                                onSelect={() => toggleAdditionalCustomer(c)}
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
                        const trimmed = additionalSearch.trim();
                        setDraftAdditionalCustomer({
                          ...getNewCustomer(),
                          ...(trimmed.includes('@') ? { email: trimmed } : { name: trimmed }),
                        });
                      }}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create new customer
                      {additionalSearch.trim() && ` "${additionalSearch.trim()}"`}
                    </button>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </>
  );
};
