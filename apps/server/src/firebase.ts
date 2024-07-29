import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { STATUSES, type Booking } from '@bookings/types';
import { dateToString, getAmountOfNightsFromDateRange, getPrice, uuidv4 } from '@bookings/helpers';

const app = initializeApp({
  apiKey: 'AIzaSyBNhfG50wEXA8XHmart7PeDIhZHH3qG0KA',
  authDomain: 'trinserhof-development.firebaseapp.com',
  databaseURL: 'https://trinserhof-development-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'trinserhof-development',
  storageBucket: 'trinserhof-development.appspot.com',
  messagingSenderId: '724042182367',
  appId: '1:724042182367:web:a0be8aa0e623da4916036a',
  measurementId: 'G-FYXT53SHJQ',
});

const database = getDatabase(app);

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
      name: '',
      message,
      status: STATUSES.PENDING,
      created: dateToString(new Date()),
      checkIn,
      checkOut,
      roomType,
      roomId: undefined,
      adults,
      children,
      pets,
      price: price ?? 0,
    };

    await set(ref(database, `bookings/${booking.id}`), booking);

    return booking;
  } catch (error) {
    console.error('Error in createBooking:', error);
    return false;
  }
};
