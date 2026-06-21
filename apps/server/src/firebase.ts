import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { defaultRoomId, type Booking } from '@bookings/types';
import { calculatePrice, uuidv4 } from '@bookings/helpers';
import { FIREBASE_CONFIG } from '@bookings/constants';

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
  roomId,
  adults,
  children,
  pets,
}: Booking): Promise<Booking | false> => {
  try {
    const price = calculatePrice({ checkIn, checkOut, roomId, adults, children, pets });

    if (!price) {
      console.error('Price could not be determined.');
    }

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
      price: price ?? 0,
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
    const { checkIn, checkOut, roomId, adults, children, pets } = booking;

    booking.price = calculatePrice({
      checkIn,
      checkOut,
      roomId,
      adults,
      children,
      pets,
    });

    await set(ref(getDb(), `bookings/${booking.id}`), booking);
    return booking;
  } catch (error) {
    console.error('Error in updateBooking:', error);
    return false;
  }
};
