import * as React from 'react';
import { Booking, PRICE_PET_PER_NIGHT } from '@trinserhof/types';
import { formatCurrency } from '@trinserhof/helpers';
import { BookingDateRangePicker } from '@trinserhof/ui';
import { NumberPicker } from '@trinserhof/ui';

type BookingPartyFieldsValue = Pick<
  Booking,
  'checkIn' | 'checkOut' | 'adults' | 'children' | 'pets'
>;

export const BookingPartyFields = ({
  booking,
  disabled,
  maxCustomers,
  onChange,
}: {
  booking: BookingPartyFieldsValue;
  disabled: boolean;
  maxCustomers?: number;
  onChange: (changes: Partial<BookingPartyFieldsValue>) => void;
}) => (
  <>
    <BookingDateRangePicker booking={booking} disabled={disabled} onChange={onChange} />

    <NumberPicker
      label="Adults"
      sublabel="Age 16+"
      disabled={disabled}
      initialAmount={booking.adults}
      minAmount={1}
      maxAmount={maxCustomers !== undefined ? maxCustomers - booking.children : undefined}
      onChange={(newValue: number) => onChange({ adults: newValue })}
    />

    <NumberPicker
      label="Children"
      sublabel="Ages 2–15"
      disabled={disabled}
      initialAmount={booking.children}
      maxAmount={maxCustomers !== undefined ? maxCustomers - booking.adults : undefined}
      onChange={(newValue: number) => onChange({ children: newValue })}
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
