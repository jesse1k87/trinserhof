import * as React from 'react';
import { NumberPicker } from './NumberPicker';
import { formatCurrency } from '@bookings/helpers';
import { petPricePerNight } from '@bookings/types';
import { BookingContext } from 'src/context/BookingContext';

export const FormPetPicker = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  return (
    <NumberPicker
      label="Amount of pets"
      sublabel={`${formatCurrency(petPricePerNight)} p.p.p.n.`}
      amount={booking.pets}
      maxAmount={3}
      onChange={(newAmount) => setBooking({ ...booking, pets: newAmount })}
    />
  );
};
