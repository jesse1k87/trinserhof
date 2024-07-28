import { ROOM_TYPES, type Room } from '@bookings/types';

export const getPrice = ({
  nights,
  roomType,
  adults,
  children,
  pets,
}: {
  nights: number;
  roomType: Room['type'];
  adults: number;
  children: number;
  pets: number;
}) => {
  try {
    const room = ROOM_TYPES.find(({ type }) => type === roomType);
    if (!room) {
      console.error(`Unknown room type '${roomType}'.`);
      return 0;
    }

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
