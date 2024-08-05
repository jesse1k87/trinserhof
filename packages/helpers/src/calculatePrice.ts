import { type Booking, Room, ROOM_TYPES, ROOMS } from '@bookings/types';
import { getAmountOfNightsFromDateRange } from './getAmountOfNightsFromDateRange';

export const calculatePrice = ({
  checkIn,
  checkOut,
  roomId,
  adults,
  children,
  pets,
}: {
  checkIn: Booking['checkIn'];
  checkOut: Booking['checkIn'];
  roomId: Booking['roomId'];
  adults: Booking['adults'];
  children: Booking['children'];
  pets: Booking['pets'];
}) => {
  try {
    const room: Room | undefined = ROOMS.find(({ id }) => id === roomId);
    if (!room) return 0;

    const nights = getAmountOfNightsFromDateRange({
      from: new Date(checkIn),
      to: new Date(checkOut),
    });

    const pricePets = nights * pets * 15;

    if (room.type === 'FAMILY') {
      const priceAdults = adults * 70;
      const priceChildren = children * 45;
      return pricePets + (priceAdults + priceChildren) * nights;
    }

    const amountOfPeople = adults + children;
    const amountOfRooms = Math.ceil(amountOfPeople / 2);
    return pricePets + amountOfRooms * nights * room.pricePerNight;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
