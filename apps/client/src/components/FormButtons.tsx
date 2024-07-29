import { Booking } from '@bookings/types';
import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import useCollection from 'src/hooks/useCollection';
import { Button } from '@/components/ui/button';

const areDifferent = (a: Booking, b: Booking) => {
  const res = ['email', 'name', 'checkIn', 'checkOut', 'adults', 'children', 'pets', 'price'].map(
    (property) => a[property] === b[property],
  );

  return res.includes(false);
};

export const FormButtons = () => {
  const bookings = useCollection('bookings');

  const [booking, setBooking] = React.useContext(BookingContext);

  if (!booking) return null;

  const original = bookings.find((b: Booking) => b.id === booking.id);

  if (!original) return null;

  const hasChanges = areDifferent(original, booking);

  if (!hasChanges) return null;

  return (
    <div className="flex flex-row justify-end gap-4">
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </div>
  );
};
