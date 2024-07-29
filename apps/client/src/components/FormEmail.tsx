import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import { Input } from '@/components/ui/input';

export const FormEmail = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  return (
    <Input
      id="email"
      type="email"
      className="flex w-full"
      value={booking.email}
      placeholder="E-mail"
      onChange={(event) => setBooking({ ...booking, name: event.target.value })}
    />
  );
};
