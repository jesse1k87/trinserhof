import * as React from 'react';
import { NumberPicker } from './NumberPicker';
import { BookingContext } from 'src/context/BookingContext';

export const FormAdultPicker = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;
  return (
    <NumberPicker
      label="Amount of adults"
      sublabel="Age 16+"
      amount={booking.adults}
      onChange={(newAmount) => setBooking({ ...booking, adults: newAmount })}
    />
  );
};
