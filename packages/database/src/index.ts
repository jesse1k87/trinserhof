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
  seedRooms as seedRoomsHelper,
  type ExtractCustomersResult,
  type CleanupBookingsResult,
  type RoomSeedResult,
} from '@trinserhof/helpers';
import { ADMINS, FIREBASE_CONFIG, KNOWN_USERS, OWNER_EMAIL } from '@trinserhof/constants';

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

/**
 * Migration: copies the rooms hardcoded in @trinserhof/types into Firebase's
 * rooms/$roomId so the client app can read room data at runtime instead of
 * bundling it, and links every existing booking to its room via a
 * `bookings/$id/rooms` reference array. Only writes when `apply` is true (a
 * read-only dry run otherwise), in a single atomic multi-path update.
 * Idempotent: rooms already matching the source data are skipped, and bookings
 * already linked to a room are left untouched.
 */
export const seedRooms = async ({ apply }: { apply: boolean }): Promise<RoomSeedResult> => {
  const rooms = (await get(ref(getDb(), 'rooms'))).val() ?? {};
  const bookings = (await get(ref(getDb(), 'bookings'))).val() ?? {};

  const result = seedRoomsHelper(rooms, bookings);

  if (apply) {
    const updates: Record<string, unknown> = {};
    for (const [id, room] of Object.entries(result.changedRooms)) {
      updates[`rooms/${id}`] = room;
    }
    for (const [id, roomIds] of Object.entries(result.bookingRoomUpdates)) {
      updates[`bookings/${id}/rooms`] = roomIds;
    }
    if (Object.keys(updates).length > 0) {
      await update(ref(getDb()), updates);
    }
  }

  return result;
};

const auth = getAuth();
const provider = new GoogleAuthProvider();

/**
 * Overwrites the entire Realtime Database root with `data`. This is the raw,
 * unguarded equivalent of editing JSON in the Firebase console — it replaces
 * every node (bookings, customers, rooms, …) with exactly what is passed in.
 *
 * Restricted to the owner (`OWNER_EMAIL`): this is a defense-in-depth check on
 * top of the ".write" rule in database.rules.json, which already only lets that
 * account write. Per-node `.validate` rules (e.g. bookings/$id) still apply, so
 * a structurally invalid payload will be rejected by Firebase.
 */
export const overwriteRawData = async (data: unknown) => {
  const email = auth.currentUser?.email;
  if (email !== OWNER_EMAIL) {
    throw new Error('Only the owner is allowed to overwrite the raw database.');
  }
  await set(ref(getDb()), data);
};

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
