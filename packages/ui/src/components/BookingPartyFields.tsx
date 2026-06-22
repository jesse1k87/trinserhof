import * as React from 'react';
import { Booking, PRICE_PET_PER_NIGHT } from '@trinserhof/types';
import { formatCurrency, getYYYYmmDD } from '@trinserhof/helpers';
import { DateRange } from 'react-day-picker';
import { FormDatePicker } from '@trinserhof/ui';
import { NumberPicker } from '@trinserhof/ui';

type BookingPartyFieldsValue = Pick<
  Booking,
  'checkIn' | 'checkOut' | 'adults' | 'children' | 'babies' | 'pets'
>;

export const BookingPartyFields = ({
  booking,
  disabled,
  onChange,
}: {
  booking: BookingPartyFieldsValue;
  disabled: boolean;
  onChange: (changes: Partial<BookingPartyFieldsValue>) => void;
}) => (
  <>
    <div className="flex flex-col w-full grid gap-1 mb-2">
      <FormDatePicker
        initialFrom={new Date(booking.checkIn)}
        initialTo={new Date(booking.checkOut)}
        disabled={disabled}
        onChange={(dateRange: DateRange | undefined) => {
          onChange({
            ...(dateRange?.from && { checkIn: getYYYYmmDD(dateRange.from) }),
            ...(dateRange?.to && { checkOut: getYYYYmmDD(dateRange.to) }),
          });
        }}
      />
    </div>

    <NumberPicker
      label="Adults"
      sublabel="Age 16+"
      disabled={disabled}
      initialAmount={booking.adults}
      onChange={(newValue: number) => onChange({ adults: newValue })}
    />

    <NumberPicker
      label="Children"
      sublabel="Ages 2–15"
      disabled={disabled}
      initialAmount={booking.children}
      onChange={(newValue: number) => onChange({ children: newValue })}
    />

    <NumberPicker
      label="Baby/toddler"
      sublabel="Free up to age 2"
      disabled={disabled}
      initialAmount={booking.babies}
      onChange={(newValue: number) => onChange({ babies: newValue })}
    />

    <NumberPicker
      label="Pets"
      sublabel={`${formatCurrency(PRICE_PET_PER_NIGHT)} p.p.p.n.`}
      disabled={disabled}
      initialAmount={booking.pets}
      onChange={(newValue: number) => onChange({ pets: newValue })}
    />
  </>
);
