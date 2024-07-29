import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';

export const Status = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  return (
    <div className="flex flex-col justify-between text-xs gap-2">
      <div>id: {booking.id}</div>
      <div className="text-gray-400">Status: {booking.status}</div>
    </div>
  );
};
