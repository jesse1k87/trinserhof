import { Booking, User } from '@bookings/types';
import { FIREBASE_CONFIG } from '@bookings/constants';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { initializeApp } from 'firebase/app';

const app = initializeApp(FIREBASE_CONFIG['production']);
const db = getDatabase(app);
export const getDb = () => db;

export const saveBooking = async (booking: Booking) => {
  try {
    await set(ref(getDb(), `bookings/${booking.id}`), booking);
  } catch (error) {
    console.error(error);
  }
};

const auth = getAuth();
const provider = new GoogleAuthProvider();

export const getCurrentUser = (setIsAdmin: (isAdmin: boolean) => void) =>
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setIsAdmin(
        [
          'hoteltrinserhof@gmail.com',
          'jennifer.m.covi@gmail.com',
          'jessica.covi@gmail.com',
        ].includes(user?.email),
      );
      return user;
    } else {
      setIsAdmin(false);
      return false;
    }
  });

export const logOut = (setIsAdmin: (isAdmin: boolean) => void) => {
  signOut(auth)
    .then((result) => setIsAdmin(false))
    .catch((error) => {
      console.error(error);
      setIsAdmin(false);
    });
};

export const logIn = () => {
  try {
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        // const token = credential.accessToken;
        // const user = result.user;
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
