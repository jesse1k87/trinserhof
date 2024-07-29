import * as React from 'react';
import { Booking, ROOM_TYPE_IDS, STATUSES } from '@bookings/types';
import { dateToString } from '@bookings/helpers';

const initialBooking = {
  id: '',
  created: dateToString(new Date()),
  email: '',
  message: '',
  status: STATUSES.PENDING,
  checkIn: dateToString(new Date()),
  checkOut: dateToString(new Date()),
  roomType: ROOM_TYPE_IDS.SUITE,
  roomId: undefined,
  adults: 1,
  children: 0,
  pets: 0,
  price: 0,
};

const useSelectedBooking = () => {
  // const [roomType, setRoomType] = React.useState<Room['type']>('SUITE');
  // const [checkIn, setCheckIn] = React.useState<Date>(new Date());
  // const [checkOut, setCheckOut] = React.useState<Date>(addDays(new Date(), 2));
  // const [nights, setNights] = React.useState<number>(
  //   getAmountOfNightsFromDateRange({ from: checkIn, to: checkOut }),
  // );
  // const [adults, setAdults] = React.useState<number>(1);
  // const [children, setChildren] = React.useState<number>(0);
  // const [pets, setPets] = React.useState<number>(0);
  // const [price, setPrice] = React.useState<number>(0);

  // React.useEffect(() => {
  //   // setNights(getAmountOfNightsFromDateRange({ from: checkIn, to: checkOut }));
  //   // setPrice(
  //   //   getPrice({
  //   //     nights,
  //   //     roomType,
  //   //     adults,
  //   //     children,
  //   //     pets,
  //   //   }),
  //   // );
  // }, [roomType, nights, adults, children, pets]);

  const [booking, setBooking] = React.useState<Booking>(initialBooking);

  // console.log('🟠 useSelectedBooking: ~ booking:', booking);

  const setAdults = (newValue: number) => {
    booking.adults = newValue;
    setBooking(booking);
  };

  const setChildren = (newValue: number) => {
    booking.children = newValue;
    setBooking(booking);
  };
  const setPets = (newValue: number) => {
    booking.pets = newValue;
    setBooking(booking);
  };

  return {
    booking,
    setBooking,
    setAdults,
    setChildren,
    setPets,
  };
};

export default useSelectedBooking;
