import { type Booking, ROOM_TYPES } from '@bookings/types';
import { getAmountOfNightsFromDateRange } from './getAmountOfNightsFromDateRange';

export const getPrice = ({
  checkIn,
  checkOut,
  roomType,
  adults,
  children,
  pets,
}: {
  checkIn: Booking['checkIn'];
  checkOut: Booking['checkIn'];
  roomType: Booking['roomType'];
  adults: Booking['adults'];
  children: Booking['children'];
  pets: Booking['pets'];
}) => {
  try {
    const room = ROOM_TYPES.find(({ type }) => type === roomType);
    if (!room) {
      console.error(`Unknown room type '${roomType}'.`);
      return 0;
    }

    const nights = getAmountOfNightsFromDateRange({
      from: new Date(checkIn),
      to: new Date(checkOut),
    });

    const pricePets = nights * pets * 15;

    if (roomType === 'FAMILY') {
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
