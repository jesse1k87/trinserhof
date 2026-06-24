import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { defaultRoomId, type Booking } from '@trinserhof/types';
import { uuidv4 } from '@trinserhof/helpers';
import { FIREBASE_CONFIG } from '@trinserhof/constants';

const getDb = () => {
  if (!getApps().length) {
    initializeApp(FIREBASE_CONFIG);
  }
  return getDatabase();
};

export const createBooking = async ({
  email,
  message,
  checkIn,
  checkOut,
  adults,
  children,
  pets,
}: Booking): Promise<Booking | false> => {
  try {
    const booking: Booking = {
      id: uuidv4(),
      email,
      name: '',
      message,
      channel: 'UNKNOWN',
      status: 'PENDING',
      checkIn,
      checkOut,
      roomId: defaultRoomId,
      adults,
      children,
      pets,
      price: 0,
      priceFixed: 0,
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
