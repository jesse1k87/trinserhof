import { Booking } from '@bookings/types';
import * as React from 'react';
import useCollection from './useBookings';

const useSelectedBooking = () => {
  const [selectedBooking, setSelectedBooking] = React.useState<Booking['id'] | undefined>(
    undefined,
  );

  const setSelectedBookingId = (bookingId: Booking['id'] | undefined) => {
    if (!bookingId) {
      setSelectedBooking(undefined);
    } else {
      const bookings = useCollection('bookings');
      const selectedBooking = bookings.find((booking: Booking) => booking.id === bookingId);
      if (selectedBooking) setSelectedBooking(selectedBooking);
    }
  };

  return { selectedBooking, setSelectedBookingId };
};

export default useSelectedBooking;
