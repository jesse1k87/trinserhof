import { Booking } from '@bookings/types';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { uuidv4 } from '@bookings/helpers';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCnUaGY69oeR5YdR9OwyguYPgGB0RyLoWs',
  appId: '1:1043164637160:web:3e88b90f9c5f1f0b66e65d',
  authDomain: 'trinserhof-bookings.firebaseapp.com',
  databaseURL: 'https://trinserhof-bookings-default-rtdb.europe-west1.firebasedatabase.app',
  messagingSenderId: '1043164637160',
  projectId: 'trinserhof-bookings',
  storageBucket: 'trinserhof-bookings.firebasestorage.app',
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
export const getDb = () => db;

export const saveBooking = async (booking: Booking) => {
  try {
    if (booking.checkIn) delete booking.start;
    if (booking.checkOut) delete booking.end;
    if (booking.roomId) delete booking.group;
    if (booking.created) delete booking.created;
    if (booking.updated) delete booking.updated;
    if (booking.className) delete booking.className;

    let notes = [];
    if (typeof booking.notes === 'string' && booking.notes !== '') {
      notes.push(booking.notes);
    }

    if (typeof booking.contact === 'string' && booking.contact !== '') {
      notes.push(booking.contact);
    }
    if (typeof booking.content === 'string' && booking.content !== '') {
      notes.push(booking.content);
    }

    booking.notes = notes.join(' ');

    delete booking.contact;
    delete booking.content;

    if (!booking.id) {
      booking.id = uuidv4();
    }

    await set(ref(getDb(), `bookings/${booking.id}`), booking);
    return booking;
  } catch (error) {
    console.error(error);
  }
};

const auth = getAuth();
const provider = new GoogleAuthProvider();

export const getSignedInUser = (
  setUser: (user: User | false) => void,
  setAdmin: (isAdmin: boolean) => void,
) =>
  onAuthStateChanged(auth, (user) => {
    if (user?.email) {
      setUser(user);
      if (['hotel@trinserhof.com', 'jennifer.m.covi@gmail.com'].includes(user.email)) {
        setAdmin(true);
      }
    } else {
      setUser(false);
      setAdmin(false);
    }
  });

export const logOut = (setUser: (user: User | false) => void) => {
  signOut(auth)
    .then((result) => setUser(false))
    .catch((error) => {
      console.error(error);
      setUser(false);
    });
};

export const logIn = () => {
  try {
    signInWithPopup(auth, provider)
      .then((result) => {
        // const credential = GoogleAuthProvider.credentialFromResult(result);
      })
      .catch((error) => {
        console.error(error);
        // const errorCode = error.code;
        // const errorMessage = error.message;
        // const email = error.customData.email;
        // const credential = GoogleAuthProvider.credentialFromError(error);
      });
  } catch (error) {
    console.error(error);
  }
};
