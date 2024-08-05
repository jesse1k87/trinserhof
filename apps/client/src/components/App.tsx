import '../index.css';
import * as React from 'react';
import { BookingContext, BookingContextType } from 'src/context/BookingContext';
import { BookingDetails } from './BookingDetails';
import { Calendar } from './Calendar';
import useCollection from 'src/hooks/useCollection';
import { Button } from '@/components/ui/button';
import { getNewBooking } from '@bookings/helpers';

export const App = () => {
  const [booking, setBooking] = React.useState<BookingContextType>(null);

  const bookings = useCollection('bookings');

  return (
    <BookingContext.Provider value={[booking, setBooking]}>
      <div className="max-h-screen flex flex-col justify-center items-center content-center">
        <div className="flex flex-row w-max justify-end p-2">
          <Button onClick={() => setBooking(getNewBooking())}>Add booking</Button>
        </div>
        <Calendar bookings={bookings} />
        {booking && (
          <BookingDetails originalBooking={bookings?.find((b) => b.id === booking?.id)} />
        )}
      </div>
    </BookingContext.Provider>
  );
};
