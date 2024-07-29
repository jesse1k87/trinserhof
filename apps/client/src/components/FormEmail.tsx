import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import { Input } from '@/components/ui/input';

export const FormEmail = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  return (
    <div>
      <div className="text-xs text-gray-400">E-mail</div>
      <Input
        id="email"
        type="email"
        className="flex w-full"
        value={booking.email}
        placeholder="E-mail"
        onChange={(event) => setBooking({ ...booking, email: event.target.value })}
      />
    </div>
  );
};
