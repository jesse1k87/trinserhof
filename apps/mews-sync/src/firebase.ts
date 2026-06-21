import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { type Booking } from '@bookings/types';
import { FIREBASE_CONFIG } from '@bookings/constants';

const getDb = () => {
  if (!getApps().length) {
    initializeApp(FIREBASE_CONFIG);
  }
  return getDatabase();
};

export const upsertBooking = async (booking: Booking) => {
  await set(ref(getDb(), `bookings/${booking.id}`), booking);
  return booking;
};
