import * as React from 'react';
import { Booking, Customer, PRICE_PET_PER_NIGHT, RoomId, User } from '@trinserhof/types';
import { formatCurrency, getCityTax, getStayPriceBreakdown } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { BookingDateRangePicker, NumberPicker } from '@trinserhof/ui';
import useCustomers from 'src/hooks/useCustomers';
import usePrices from 'src/hooks/usePrices';
import useRooms from 'src/hooks/useRooms';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import {
  X as Cross2Icon,
  User as PersonIcon,
  Eye as EyeIcon,
  House as HomeIcon,
} from 'lucide-react';
import { PageSubHeader } from '@trinserhof/ui';
import { PriceSummary } from './PriceSummary';
import { CustomerSelect } from './CustomerSelect';

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
  const customers = useCustomers();
  const rooms = useRooms();
  const prices = usePrices();

  const additionalCustomerIds = booking.customers;
  const additionalCustomers = customers.filter((c) => additionalCustomerIds.includes(c.id));

  const toggleAdditionalCustomer = (selected: Customer) => {
    const isLinked = additionalCustomerIds.includes(selected.id);
    const nextRest = isLinked
      ? additionalCustomerIds.filter((id) => id !== selected.id)
      : [...additionalCustomerIds, selected.id];

    onChange({
      ...booking,
      customers: nextRest,
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
  const grossTotal = total !== undefined ? total + petsCost + (tax ?? 0) + cityTax : undefined;

  return (
    <>
      <BookingDateRangePicker
        booking={booking}
        enabled={enabled}
        onChange={(changes) => onChange({ ...booking, ...changes })}
      />

      <div className="flex flex-col w-full grid gap-3 rounded-md border p-3">
        <PageSubHeader icon={<PersonIcon className="size-5" />} title="Guests" />

        {mode === 'update' && (
          <div className="flex flex-col w-full grid gap-1">
            {additionalCustomers.map((c) => (
              <div key={c.id} className="flex flex-row gap-2 items-center">
                <div className="flex-1 rounded-md border px-3 py-2 text-sm">
                  {[c.name, c.surname].filter(Boolean).join(' ') || c.email}
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="View customer"
                  className="hover:cursor-pointer"
                  onClick={() => onViewCustomer(c)}
                >
                  <EyeIcon />
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
          </div>
        )}

        {booking.customers.length < booking.adults + booking.children && (
          <CustomerSelect
            customers={customers}
            triggerLabel="Add guest to room"
            onSelect={toggleAdditionalCustomer}
            user={user}
            enabled={enabled}
            linkedIds={additionalCustomerIds}
          />
        )}

        <div className="flex flex-col w-full grid gap-3 p-3">
          <NumberPicker
            label="Adults"
            sublabel="Age 16+"
            enabled={enabled}
            initialAmount={booking.adults}
            minAmount={1}
            maxAmount={
              selectedRoom?.maxCustomers !== undefined
                ? selectedRoom?.maxCustomers - booking.children
                : undefined
            }
            onChange={(newValue: number) => onChange({ ...booking, ...{ adults: newValue } })}
          />

          <NumberPicker
            label="Children"
            sublabel="Ages 2–15"
            enabled={enabled}
            initialAmount={booking.children}
            maxAmount={
              selectedRoom?.maxCustomers !== undefined
                ? selectedRoom?.maxCustomers - booking.adults
                : undefined
            }
            onChange={(newValue: number) => onChange({ ...booking, ...{ children: newValue } })}
          />

          <NumberPicker
            label="Pets"
            sublabel={`${formatCurrency(PRICE_PET_PER_NIGHT)} p.p.p.n.`}
            enabled={enabled}
            initialAmount={booking.pets}
            onChange={(newValue: number) => onChange({ ...booking, ...{ pets: newValue } })}
          />
        </div>
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
          {rooms.map(({ id, type }) => (
            <SelectItem key={id} value={id}>
              <div className="flex items-center justify-center gap-3">
                <HomeIcon className="size-4 shrink-0" />
                <div className="flex items-center gap-3">
                  <div className="leading-none">Room {id}</div>
                  <div className="text-xs text-muted-foreground leading-none">
                    {prices.base[type] !== undefined
                      ? formatCurrency(prices.base[type])
                      : 'No price set'}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <PriceSummary
        nightCount={nightCount}
        pricePerNight={booking.pricePerNight}
        total={total}
        pets={booking.pets}
        petsCost={petsCost}
        tax={tax}
        cityTax={cityTax}
        grossTotal={grossTotal}
        hasSelectedRoom={Boolean(selectedRoom)}
        hasUnknownPrice={priceBreakdown.hasUnknownPrice}
        roomType={selectedRoom?.type}
      />
    </>
  );
};
