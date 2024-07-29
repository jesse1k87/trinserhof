import '../index.css';
import * as React from 'react';
import { Calendar } from './Calendar';
import useCollection from 'src/hooks/useBookings';
import { BookingDetails } from './BookingDetails';
import { BookingContext, emptyBooking } from '../provider/BookingProvider';
import { Booking } from '@bookings/types';

export const App = () => {
  const bookings = useCollection('bookings');
  const [booking, setBooking] = React.useState(emptyBooking);

  // const { setBooking } = useSelectedBooking();

  const setSelectedBookingId = React.useCallback(
    (id: Booking['id']) => {
      if (bookings) {
        const selectedBooking = bookings.find((b: Booking) => b.id === id);
        if (selectedBooking) setBooking(selectedBooking);
      }
    },
    [bookings],
  );

  return (
    <BookingContext.Provider value={booking}>
      <div className="max-h-screen flex">
        <Calendar bookings={bookings} setSelectedBookingId={setSelectedBookingId} />
        <BookingDetails booking={booking} />
      </div>
    </BookingContext.Provider>
  );
};
