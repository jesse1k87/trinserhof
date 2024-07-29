import * as React from 'react';
import { NumberPicker } from './NumberPicker';
import { BookingContext } from 'src/context/BookingContext';

export const FormChildPicker = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;
  return (
    <NumberPicker
      label="Amount of children"
      sublabel="Ages 2–15"
      amount={booking.children}
      onChange={(newAmount) => setBooking({ ...booking, children: newAmount })}
    />
  );
};
