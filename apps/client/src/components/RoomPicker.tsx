import * as React from 'react';
import { Select } from './Select';
import { ROOM_TYPES, ROOMS } from '@bookings/types';
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
    <ShadCnSelect
      defaultValue={roomId}
      onValueChange={(value) => setBooking({ ...booking, roomId: value })}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROOMS.map(({ id, label }) => (
          <SelectItem key={id} value={id}>
            Room {id}
            <div className="text-xs text-gray-400">{label}</div>
          </SelectItem>
        ))}
      </SelectContent>
    </ShadCnSelect>
  );
};
