import { Booking } from '@trinserhof/types';
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
import { uuidv4 } from '@trinserhof/helpers';
import { FIREBASE_CONFIG } from '@trinserhof/constants';

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

export const ADMINS = ['jesse1k87@gmail.com'];

const KNOWN_USERS = [
  ...ADMINS,
  'hotel@trinserhof.com',
  'jennifer.m.covi@gmail.com',
  'jessica.covi@gmail.com',
  'ipad@trinserhof.com',
];

export const getSignedInUser = (
  setUser: (user: User | false) => void,
  setAdmin: (isAdmin: boolean) => void,
  setError: (error: 'NOT_ALLOWED' | null) => void,
) =>
  onAuthStateChanged(auth, (user) => {
    setUser(false);
    setAdmin(false);
    setError(null);

    if (user?.email) {
      if (!KNOWN_USERS.includes(user.email)) {
        setError('NOT_ALLOWED');
      } else {
        setUser(user);
      }
      if (ADMINS.includes(user.email)) {
        setAdmin(true);
      }
    }
  });

export const logOut = (setUser: (user: User | false) => void) => {
  signOut(auth)
    .then(() => setUser(false))
    .catch((error) => {
      console.error(error);
      setUser(false);
    });
};

export const logIn = (onError?: (errorCode: string) => void) => {
  signInWithPopup(auth, provider).catch((error) => {
    console.error(error);
    onError?.(error.code);
  });
};
