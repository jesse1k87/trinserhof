import { initializeApp } from 'firebase/app';
import { FIREBASE_CONFIG } from '@bookings/constants';
import { getDatabase, ref, set } from 'firebase/database';
import { Booking } from '@bookings/types';

const app = initializeApp(FIREBASE_CONFIG['development']);

const db = getDatabase(app);

export const getDb = () => db;

export const saveBooking = async (booking: Booking) => {
  try {
    await set(ref(getDb(), `bookings/${booking.id}`), booking);
  } catch (error) {
    console.error(error);
  }
};
