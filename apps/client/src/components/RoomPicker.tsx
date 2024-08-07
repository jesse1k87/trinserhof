import * as React from 'react';
import { ROOMS } from '@bookings/types';
import { BookingContext } from 'src/context/BookingContext';
import {
  Select as ShadCnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


export const RoomPicker = () => {
  const [booking, setBooking] = React.useContext(BookingContext);
  if (!booking) return null;

  const [roomId, setRoomId] = React.useState(booking.roomId);

  React.useEffect(() => {
    setRoomId(booking.roomId);
  }, [booking]);

  return (
    
  );
};
