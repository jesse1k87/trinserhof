import * as React from 'react';
import { getAmountOfNightsFromDateRange, getPrice } from '@bookings/helpers';
import { Room } from '@bookings/types';
import { addDays } from 'date-fns';

const useBookingForm = ({
  defaultNights = 2,
  initialCheckIn = new Date(),
  initialCheckOut = addDays(new Date(), defaultNights),
}: {
  defaultNights?: number;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
}) => {
  const [roomType, setRoomType] = React.useState<Room['type']>('SUITE');

  const [checkIn, setCheckIn] = React.useState<Date>(initialCheckIn);
  const [checkOut, setCheckOut] = React.useState<Date>(initialCheckOut);
  const [nights, setNights] = React.useState<number>(defaultNights);

  const [adults, setAdults] = React.useState<number>(1);
  const [children, setChildren] = React.useState<number>(0);
  const [pets, setPets] = React.useState<number>(0);

  const [price, setPrice] = React.useState<number>(0);

  React.useEffect(() => {
    setNights(getAmountOfNightsFromDateRange({ from: checkIn, to: checkOut }));
    setPrice(
      getPrice({
        nights,
        roomType,
        adults,
        children,
        pets,
      }),
    );
  }, [roomType, nights, adults, children, pets]);

  return {
    roomType,
    setRoomType,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    nights,
    setNights,
    adults,
    setAdults,
    children,
    setChildren,
    pets,
    setPets,
    price,
  };
};

export default useBookingForm;
