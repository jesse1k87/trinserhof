import '../index.css';
import * as React from 'react';
import { formatCurrency, getNewBooking, getYYYYmmDD, isValidEmailAddress } from '@bookings/helpers';
import { Booking, PRICE_PET_PER_NIGHT } from '@bookings/types';
import { Button, FormDatePicker, Input, NumberPicker, Textarea } from '@bookings/ui';
import { DateRange } from 'react-day-picker';

export const App = () => {
  const [booking, setBooking] = React.useState<Booking>(getNewBooking());
  return (
    <div className="flex flex-col w-full content-center items-center">
      <div className="flex flex-col grid gap-4 p-6 grid-cols-1 content-start min-w-[280px] max-w-[280px] bg-white">
        <div className="flex flex-row justify-center">
          <img src="hotel-trinserhof.png" className="my-4 max-h-[100px]" />
        </div>
        <div className="flex flex-col w-full grid gap-1 mb-2">
          <FormDatePicker
            initialFrom={new Date(booking.checkIn)}
            initialTo={new Date(booking.checkOut)}
            disabled={false}
            onChange={(dateRange: DateRange | undefined) => {
              setBooking({
                ...booking,
                ...(dateRange?.from && { checkIn: getYYYYmmDD(dateRange.from) }),
                ...(dateRange?.to && { checkOut: getYYYYmmDD(dateRange.to) }),
              });
            }}
          />
        </div>

        <NumberPicker
          label="Adults"
          sublabel="Age 16+"
          disabled={false}
          initialAmount={booking.adults}
          onChange={(newValue: number) => setBooking({ ...booking, adults: newValue })}
        />

        <NumberPicker
          label="Children"
          sublabel="Ages 2–15"
          disabled={false}
          initialAmount={booking.children}
          onChange={(newValue: number) => setBooking({ ...booking, children: newValue })}
        />

        <NumberPicker
          label="Baby/toddler"
          sublabel="Free up to age 2"
          disabled={false}
          initialAmount={booking.babies}
          onChange={(newValue: number) => setBooking({ ...booking, babies: newValue })}
        />

        <NumberPicker
          label="Pets"
          sublabel={`${formatCurrency(PRICE_PET_PER_NIGHT)} p.p.p.n.`}
          disabled={false}
          initialAmount={booking.pets}
          onChange={(newValue: number) => setBooking({ ...booking, pets: newValue })}
        />

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">E-mail</div>
          <Input
            placeholder="E-mail"
            value={booking.email}
            disabled={false}
            onChange={(event) => setBooking({ ...booking, email: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-gray-500">Message</div>
          <Textarea
            placeholder="Message"
            className="w-full"
            value={booking.notes}
            onChange={(event) => setBooking({ ...booking, notes: event.target.value })}
          />
        </div>

        <div className="flex flex-row justify-center">
          <Button
            disabled={Boolean(
              booking.adults === 0 ||
                !booking.checkIn ||
                !booking.checkOut ||
                !isValidEmailAddress(booking.email),
            )}
            onClick={async () => setBooking(await saveBooking(booking))}
          >
            Request reservation
          </Button>
        </div>
      </div>
    </div>
  );
};
