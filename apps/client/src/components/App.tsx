import '../index.css';
import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import { BookingDetails } from './BookingDetails';
import { Calendar } from './Calendar';
import useCollection from 'src/hooks/useCollection';

export const App = () => {
  const store = React.useState(null);

  const bookings = useCollection('bookings');

  const originalBooking = bookings?.find((b) => b.id === store[0]?.id);

  return (
    <BookingContext.Provider value={store}>
      <div className="max-h-screen flex justify-center items-center content-center">
        <Calendar bookings={bookings} />
        {store[0] && <BookingDetails originalBooking={originalBooking} />}
      </div>
    </BookingContext.Provider>
  );
};
