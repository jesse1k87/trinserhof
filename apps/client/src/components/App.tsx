import '../index.css';
import * as React from 'react';
import { BookingContext } from 'src/context/BookingContext';
import { BookingDetails } from './BookingDetails';
import { Calendar } from './Calendar';
import useCollection from 'src/hooks/useCollection';

export const App = () => {
  const store = React.useState(null);

  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const bookings = useCollection('bookings');

  return (
    <BookingContext.Provider value={store}>
      <div className="max-h-screen flex">
        <Calendar bookings={bookings} setDetailsOpen={setDetailsOpen} />
        {detailsOpen && <BookingDetails setDetailsOpen={setDetailsOpen} />}
      </div>
    </BookingContext.Provider>
  );
};
