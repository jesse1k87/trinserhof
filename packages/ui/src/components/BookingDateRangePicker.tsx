import * as React from 'react';
import { Booking } from '@trinserhof/types';
import { getYYYYmmDD } from '@trinserhof/helpers';
import { DateRange } from 'react-day-picker';
import { FormDatePicker } from '@trinserhof/ui';

type BookingDateRangePickerValue = Pick<Booking, 'checkIn' | 'checkOut'>;

export const BookingDateRangePicker = ({
  booking,
  disabled,
  onChange,
}: {
  booking: BookingDateRangePickerValue;
  disabled: boolean;
  onChange: (changes: Partial<BookingDateRangePickerValue>) => void;
}) => (
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
);
