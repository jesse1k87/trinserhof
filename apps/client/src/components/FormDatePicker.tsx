import * as React from 'react';
import { DateRangePicker } from './DateRangePicker';
import { BookingContext } from 'src/context/BookingContext';
import { getAmountOfNightsFromDateRange } from '@bookings/helpers';

export const FormDatePicker = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  const nights = getAmountOfNightsFromDateRange({
    from: new Date(booking.checkIn),
    to: new Date(booking.checkOut),
  });

  return (
    <div className="flex w-full items-center">
      <DateRangePicker
      // onChange={(dateRange: DateRange) => {
      //   if (dateRange?.from && dateRange.from) {
      //     setBooking({
      //       ...booking,
      //       checkIn: dateRange.from,
      //       checkOut: dateRange.to,
      //       nights: getAmountOfNightsFromDateRange({
      //         from: dateRange.from,
      //         to: dateRange.to,
      //       }),
      //     });
      //   }
      // }}
      />
      <div className="ml-2 text-xs text-gray-500">
        {nights} {nights === 1 ? 'night' : 'nights'}
      </div>
    </div>
  );
};
