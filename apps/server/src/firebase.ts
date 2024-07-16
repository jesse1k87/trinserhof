import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import dotenv from 'dotenv';

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

const dateString = (date: Date) => {
  return date.toISOString().split('T').join(' ');
};

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const createBooking = async ({
  email,
  checkIn,
  checkOut,
  adults,
  children,
  pets,
  totalPrice,
}: {
  email: string;
  checkIn: Date;
  checkOut: Date;
  adults: Number;
  children: Number;
  pets: Number;
  totalPrice: Number;
}) => {
  const newBooking = {
    created: dateString(new Date()),
    updated: dateString(new Date()),
    email,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    adults,
    children,
    pets,
    totalPrice,
  };
  const id = uuidv4();
  await set(ref(db, `bookings/${id}`), newBooking);
  return id;
};
