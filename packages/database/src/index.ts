import { Booking, Customer } from '@trinserhof/types';
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
import { ADMINS, FIREBASE_CONFIG, KNOWN_USERS } from '@trinserhof/constants';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
export const getDb = () => db;

// Mirrors the field requirements enforced by bookings/$bookingId/.validate in database.rules.json,
// so a rejected write can be reported back with the specific field(s) that failed instead of just "PERMISSION_DENIED".
const REQUIRED_BOOKING_FIELD_TYPES: Record<string, 'string' | 'number' | 'boolean'> = {
  email: 'string',
  checkIn: 'string',
  checkOut: 'string',
  status: 'string',
  roomId: 'string',
  channel: 'string',
  adults: 'number',
  children: 'number',
  babies: 'number',
  pets: 'number',
  price: 'number',
  priceFixed: 'string',
  halbpension: 'boolean',
};

export const getBookingValidationErrors = (booking: Booking): string[] =>
  Object.entries(REQUIRED_BOOKING_FIELD_TYPES).reduce<string[]>((errors, [field, type]) => {
    const value = (booking as Record<string, unknown>)[field];
    if (value === undefined || value === null) {
      errors.push(`${field} is missing`);
    } else if (typeof value !== type) {
      errors.push(`${field} must be a ${type} (got ${typeof value})`);
    }
    return errors;
  }, []);

export const saveBooking = async (booking: Booking) => {
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

  const validationErrors = getBookingValidationErrors(booking);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid booking data: ${validationErrors.join(', ')}`);
  }

  await set(ref(getDb(), `bookings/${booking.id}`), booking);
  return booking;
};

export const saveCustomer = async (customer: Customer) => {
  try {
    if (!customer.id) {
      customer.id = uuidv4();
    }

    await set(ref(getDb(), `customers/${customer.id}`), customer);
    return customer;
  } catch (error) {
    console.error(error);
  }
};

const auth = getAuth();
const provider = new GoogleAuthProvider();

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
