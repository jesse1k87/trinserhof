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
      className="flex w-full"
      value={booking.name}
      placeholder="Name"
      onChange={(event) => setBooking({ ...booking, name: event.target.value })}
    />
  );
};
