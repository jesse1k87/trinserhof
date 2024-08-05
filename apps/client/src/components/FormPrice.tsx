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
        <Label className={`font-semibold ${price === 0 && 'text-gray-400'}`}>Total price</Label>
      </div>
      <div className={`flex flex-col font-semibold text-lg ${price === 0 && 'text-gray-400'}`}>
        {formatCurrency(price)}
        <div className="flex justify-end text-xs">excl. VAT </div>
      </div>
    </div>
  );
};
