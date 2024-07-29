import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import { Textarea } from '@/components/ui/textarea';

export const FormName = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  return (
    <Textarea
      id="name"
      placeholder="Enter a name"
      className="flex w-full max-h-[72px]  text-3xl font-bold p-0 border-0 focus-visible:ring-0 shadow-none resize-none overflow-y-visible"
      value={booking.name}
      onChange={(event) => setBooking({ ...booking, name: event.target.value })}
    />
  );
};
