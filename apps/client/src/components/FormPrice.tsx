import * as React from 'react';
import { Label } from '@/components/ui/label';
import { formatCurrency, calculatePrice } from '@bookings/helpers';
import { BookingContext } from 'src/context/BookingContext';

export const FormPrice = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  const { checkIn, checkOut, roomId, adults, children, pets } = booking;
  const price = calculatePrice({ checkIn, checkOut, roomId, adults, children, pets });

  return (
    <div className="grid items-center justify-items-end gap-4 grid-cols-2">
      <div className="flex w-full">
        <Label className="font-semibold">Total price</Label>
      </div>
      <div className="flex flex-col text-right">
        {booking.priceFixed && <s className="text-lg">{formatCurrency(price)}</s>}
        <div className="flex justify-end text-lg font-semibold">
          {formatCurrency(booking.priceFixed ?? price)}
        </div>
        <div className="flex justify-end text-xs">excl. VAT </div>
      </div>
    </div>
  );
};
