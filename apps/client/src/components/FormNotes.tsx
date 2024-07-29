import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { BookingContext } from 'src/context/BookingContext';

export const FormNotes = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  return (
    <div>
      <div className="text-xs text-gray-400">Notes</div>
      <Textarea
        placeholder="Notes"
        id="message"
        className="w-full"
        value={booking.notes}
        onChange={(event) => setBooking({ ...booking, notes: event.target.value })}
      />
    </div>
  );
};
