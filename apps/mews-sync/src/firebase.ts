import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { type Booking } from '@bookings/types';
import { BOOKINGS_PATH } from '@bookings/constants';

const getDb = () => {
  if (!getApps().length) {
    initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      appId: process.env.FIREBASE_APP_ID,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
  return getDatabase();
};

export const upsertBooking = async (booking: Booking) => {
  await set(ref(getDb(), `${BOOKINGS_PATH}/${booking.id}`), booking);
  return booking;
};
