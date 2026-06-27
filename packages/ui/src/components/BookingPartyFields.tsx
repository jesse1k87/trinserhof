import * as React from 'react';
import { Booking, PRICE_PET_PER_NIGHT } from '@trinserhof/types';
import { formatCurrency } from '@trinserhof/helpers';
import { NumberPicker } from '@trinserhof/ui';

type BookingPartyFieldsValue = Pick<Booking, 'adults' | 'children' | 'pets'>;

export const BookingPartyFields = ({
  booking,
  enabled,
  maxCustomers,
  onChange,
}: {
  booking: BookingPartyFieldsValue;
  enabled: boolean;
  maxCustomers?: number;
  onChange: (changes: Partial<BookingPartyFieldsValue>) => void;
}) => (
  <>
    <NumberPicker
      label="Adults"
      sublabel="Age 16+"
      enabled={enabled}
      initialAmount={booking.adults}
      minAmount={1}
      maxAmount={maxCustomers !== undefined ? maxCustomers - booking.children : undefined}
      onChange={(newValue: number) => onChange({ adults: newValue })}
    />

    <NumberPicker
      label="Children"
      sublabel="Ages 2–15"
      enabled={enabled}
      initialAmount={booking.children}
      maxAmount={maxCustomers !== undefined ? maxCustomers - booking.adults : undefined}
      onChange={(newValue: number) => onChange({ children: newValue })}
    />

    <NumberPicker
      label="Pets"
      sublabel={`${formatCurrency(PRICE_PET_PER_NIGHT)} p.p.p.n.`}
      enabled={enabled}
      initialAmount={booking.pets}
      onChange={(newValue: number) => onChange({ pets: newValue })}
    />
  </>
);
