import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import { Input } from '@/components/ui/input';

export const FormName = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  return (
    <Input
      id="name"
      type="text"
      className="flex w-full text-2xl font-bold p-0 border-0 focus-visible:ring-0 shadow-none"
      value={booking.name}
      placeholder="Enter a name"
      onChange={(event) => setBooking({ ...booking, name: event.target.value })}
    />
  );
};
