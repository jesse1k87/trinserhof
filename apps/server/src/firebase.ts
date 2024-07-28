import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import dotenv from 'dotenv';
import { STATUSES, type Booking } from '@bookings/types';
import { dateToString, getAmountOfNightsFromDateRange, getPrice, uuidv4 } from '@bookings/helpers';

dotenv.config();

const app = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
});

const db = getDatabase(app);

export const createBooking = async ({
  email,
  message,
  checkIn,
  checkOut,
  roomType,
  adults,
  children,
  pets,
}: Booking): Promise<Booking | false> => {
  try {
    const nights = getAmountOfNightsFromDateRange({
      from: new Date(checkIn),
      to: new Date(checkOut),
    });

    const price = getPrice({ nights, roomType, adults, children, pets });

    if (!price) {
      console.error('Price could not be determined.');
    }

    const booking: Booking = {
      id: uuidv4(),
      email,
      message,
      status: STATUSES.PENDING,
      created: dateToString(new Date()),
      checkIn,
      checkOut,
      roomType,
      adults,
      children,
      pets,
      price: price ?? 0,
    };

    await set(ref(db, `bookings/${booking.id}`), booking);

    return booking;
  } catch (error) {
    console.error('Error in createBooking:', error);
    return false;
  }
};
