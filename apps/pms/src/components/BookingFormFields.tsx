import * as React from 'react';
import { Booking, Customer, PRICE_PET_PER_NIGHT, RoomId, User } from '@trinserhof/types';
import { formatCurrency, getStayPriceBreakdown } from '@trinserhof/helpers';
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
import { ICONS } from '@trinserhof/ui';
import { PageSubHeader } from '@trinserhof/ui';
import { PriceSummary } from './PriceSummary';
import { CustomerSelect } from './CustomerSelect';

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
  const allCustomers = useCustomers();
  const rooms = useRooms();
  const prices = usePrices();

  const bookingCustomers = allCustomers.filter((c) => booking.customers.includes(c.id));

  const toggleAdditionalCustomer = (selected: Customer) => {
    const isLinked = booking.customers.includes(selected.id);
    const nextRest = isLinked
      ? booking.customers.filter((id) => id !== selected.id)
      : [...booking.customers, selected.id];

    onChange({
      ...booking,
      customers: nextRest,
    });
  };

  const selectedRoom = rooms.find((room) => room.id === booking.roomId);

  return (
    <>
      <BookingDateRangePicker
        booking={booking}
        enabled={enabled}
        onChange={(changes) => onChange({ ...booking, ...changes })}
      />

      <div className="flex flex-col w-full grid gap-2 p-3 rounded-md border">
        <PageSubHeader icon={<ICONS.guest className="size-5" />} title="Guests" />

        <div className="flex flex-col w-full grid gap-1">
          {bookingCustomers.map((c) => (
            <div key={c.id} className="flex flex-row gap-2 items-center">
              <div className="flex-1 rounded-md border px-3 py-2 text-sm">
                {[c.name, c.surname].filter(Boolean).join(' ') || c.email}
                <div className="text-xs text-base-content/60">{c.email}</div>
              </div>
              <Button
                variant="outline"
                size="icon"
                aria-label="View customer"
                className="hover:cursor-pointer"
                onClick={() => onViewCustomer(c)}
              >
                <ICONS.view />
              </Button>
              {enabled && selectedRoom?.maxCustomers && bookingCustomers.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Remove customer"
                  className="hover:cursor-pointer"
                  onClick={() => toggleAdditionalCustomer(c)}
                >
                  <ICONS.close />
                </Button>
              )}
            </div>
          ))}
        </div>

        {booking.customers.length < booking.adults + booking.children && (
          <CustomerSelect
            customers={allCustomers}
            triggerLabel={`Add ${booking.adults + booking.children - booking.customers.length} other guests to booking`}
            onSelect={toggleAdditionalCustomer}
            user={user}
            enabled={enabled}
            linkedIds={booking.customers}
          />
        )}

        <div className="flex flex-col w-full grid gap-3 p-1">
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
          const newRoom = rooms.find((room) => room.id === newRoomId);
          const newPriceBreakdown = getStayPriceBreakdown(
            prices,
            newRoom?.type,
            booking.checkIn,
            booking.checkOut,
          );
          onChange({
            ...booking,
            roomId: newRoomId,
            pricePerNight: newPriceBreakdown.nights[0]?.price,
          });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a room" />
        </SelectTrigger>
        <SelectContent>
          {rooms.map(({ id, type }) => (
            <SelectItem key={id} value={id}>
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ICONS.home className="size-4 shrink-0" />
                  <div className="leading-none">Room {id}</div>
                </div>
                <div className="text-xs text-base-content/60 leading-none text-right pr-2">
                  {prices.base[type] !== undefined
                    ? formatCurrency(prices.base[type])
                    : 'No price set'}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedRoom && (
        <PriceSummary booking={booking} roomType={selectedRoom.type} onChange={onChange} />
      )}
    </>
  );
};
