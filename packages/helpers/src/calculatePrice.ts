import { type Booking, PRICE_PET_PER_NIGHT, Room, ROOMS } from '@trinserhof/types';
import { getAmountOfNightsFromDateRange } from './getAmountOfNightsFromDateRange';

const getPricePerNight = (room, nights: number) => {
  if (typeof room.pricePerNight === 'number') return room.pricePerNight;

  if (typeof room.pricePerNight === 'object') {
    let pricePerNight = 0;
    Object.keys(room.pricePerNight).map((amountOfNights) => {
      if (nights >= amountOfNights) {
        pricePerNight = room.pricePerNight[amountOfNights];
      }
    });
    return pricePerNight;
  }

  return 0;
};

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

    const pricePets = nights * pets * PRICE_PET_PER_NIGHT;

    if (room.type === 'FAMILY') {
      const priceAdults = adults * 70;
      const priceChildren = children * 45;
      return pricePets + (priceAdults + priceChildren) * nights;
    }

    const amountOfPeople = adults + children;
    const amountOfRooms = Math.ceil(amountOfPeople / 2);

    const pricePerNight = getPricePerNight(room, nights);

    return pricePets + amountOfRooms * nights * pricePerNight;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
