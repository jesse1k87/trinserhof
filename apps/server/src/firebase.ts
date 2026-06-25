import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import type { Booking } from '@trinserhof/types';
import { uuidv4 } from '@trinserhof/helpers';
import { FIREBASE_CONFIG } from '@trinserhof/constants';

const getDb = () => {
  if (!getApps().length) {
    initializeApp(FIREBASE_CONFIG);
  }
  return getDatabase();
};

export const createBooking = async ({
  adults,
  checkIn,
  checkOut,
  children,
  customers,
  pets,
}: Booking): Promise<Booking | false> => {
  try {
    const booking: Booking = {
      adults,
      checkIn,
      checkOut,
      children,
      customers,
      id: uuidv4(),
      pets,
      roomId: '',
      status: 'PENDING',
    };

    await set(ref(getDb(), `bookings/${booking.id}`), booking);

    return booking;
  } catch (error) {
    console.error('Error in createBooking:', error);
    return false;
  }
};

export const updateBooking = async (booking: Booking) => {
  try {
    await set(ref(getDb(), `bookings/${booking.id}`), booking);
    return booking;
  } catch (error) {
    console.error('Error in updateBooking:', error);
    return false;
  }
};
