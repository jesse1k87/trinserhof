import { Booking, Customer } from '@trinserhof/types';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { getDatabase, ref, set, get, update } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import {
  uuidv4,
  extractCustomersFromBookings,
  cleanupLegacyBookings as cleanupLegacyBookingsHelper,
  getBookingValidationErrors,
  mergeLegacyNotes,
  type ExtractCustomersResult,
  type CleanupBookingsResult,
} from '@trinserhof/helpers';
import { ADMINS, FIREBASE_CONFIG, KNOWN_USERS } from '@trinserhof/constants';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
export const getDb = () => db;

export { getBookingValidationErrors };

export const saveBooking = async (booking: Booking) => {
  if (booking.checkIn) delete booking.start;
  if (booking.checkOut) delete booking.end;
  if (booking.roomId) delete booking.group;
  if (booking.created) delete booking.created;
  if (booking.updated) delete booking.updated;
  if (booking.className) delete booking.className;

  booking.notes = mergeLegacyNotes(booking);

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

/**
 * Migration: extract a separate `customers` collection out of the bookings.
 *
 * Reads the current bookings and customers, computes new/merged customer
 * records and booking links via extractCustomersFromBookings, and — only when
 * `apply` is true — writes them to Firebase in a single atomic multi-path
 * update. With `apply: false` it's a read-only dry run (nothing is written) so
 * the UI can preview what would change. Idempotent: bookings already linked to
 * a customer are skipped.
 */
export const migrateBookingsToCustomers = async ({
  apply,
}: {
  apply: boolean;
}): Promise<ExtractCustomersResult> => {
  const bookings = (await get(ref(getDb(), 'bookings'))).val() ?? {};
  const customers = (await get(ref(getDb(), 'customers'))).val() ?? {};

  const result = extractCustomersFromBookings(bookings, customers);

  if (apply) {
    const updates: Record<string, unknown> = {};
    for (const [id, customer] of Object.entries(result.changedCustomers)) {
      updates[`customers/${id}`] = customer;
    }
    for (const [id, customerIds] of Object.entries(result.bookingCustomerUpdates)) {
      updates[`bookings/${id}/customers`] = customerIds;
    }
    if (Object.keys(updates).length > 0) {
      await update(ref(getDb()), updates);
    }
  }

  return result;
};

/**
 * Migration: backfills legacy bookings (old start/end/group/contact/content
 * schema, or missing newer fields like channel/priceFixed/halbpension) onto
 * the current Booking schema, writing each changed booking as a full node
 * replace so it always satisfies the bookings/$bookingId .validate rule.
 * Idempotent: bookings already on the current schema are left untouched.
 */
export const cleanupLegacyBookings = async ({
  apply,
}: {
  apply: boolean;
}): Promise<CleanupBookingsResult> => {
  const bookings = (await get(ref(getDb(), 'bookings'))).val() ?? {};

  const result = cleanupLegacyBookingsHelper(bookings);

  if (apply) {
    const updates: Record<string, unknown> = {};
    for (const [id, booking] of Object.entries(result.changedBookings)) {
      updates[`bookings/${id}`] = booking;
    }
    if (Object.keys(updates).length > 0) {
      await update(ref(getDb()), updates);
    }
  }

  return result;
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
