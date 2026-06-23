import {
  type AuditEvent,
  Booking,
  Customer,
  User as UserRecord,
  type Role,
  DEFAULT_ROLE,
  canAccess,
  canEdit,
} from '@trinserhof/types';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { getDatabase, ref, set, get, update, push, serverTimestamp } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import {
  uuidv4,
  extractCustomersFromBookings,
  cleanupLegacyBookings as cleanupLegacyBookingsHelper,
  getBookingValidationErrors,
  mergeLegacyNotes,
  seedRooms as seedRoomsHelper,
  markPastBookingsCheckedOut as markPastBookingsCheckedOutHelper,
  getYYYYmmDD,
  type ExtractCustomersResult,
  type CleanupBookingsResult,
  type RoomSeedResult,
  type CheckedOutResult,
} from '@trinserhof/helpers';
import { FIREBASE_CONFIG, OWNER_EMAIL } from '@trinserhof/constants';

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
 * rooms/$roomId so the PMS app can read room data at runtime instead of
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

/**
 * Migration: marks past CONFIRMED and PAID bookings (check-out date already in
 * the past) as CHECKED_OUT. Reads the current bookings, computes the status
 * changes via markPastBookingsCheckedOut, and — only when `apply` is true —
 * writes them to Firebase in a single atomic multi-path update touching just
 * each booking's `status` field. With `apply: false` it's a read-only dry run.
 * Idempotent: bookings not in CONFIRMED/PAID, or not yet past, are skipped.
 */
export const markPastBookingsCheckedOut = async ({
  apply,
}: {
  apply: boolean;
}): Promise<CheckedOutResult> => {
  const bookings = (await get(ref(getDb(), 'bookings'))).val() ?? {};

  const result = markPastBookingsCheckedOutHelper(bookings, getYYYYmmDD(new Date()));

  if (apply) {
    const updates: Record<string, unknown> = {};
    for (const [id, status] of Object.entries(result.changedBookings)) {
      updates[`bookings/${id}/status`] = status;
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

/**
 * Updates another user's `role` (BLOCKED / VIEWER / MANAGER). The owner row
 * itself isn't editable through this — being the owner comes from matching
 * `OWNER_EMAIL`, not from a stored role.
 *
 * Restricted to the owner (`OWNER_EMAIL`): this is a defense-in-depth check on
 * top of the `users/$userId/role` ".validate" rule in database.rules.json,
 * which already only lets that account write that field.
 */
export const setUserRole = async (userId: string, role: Role) => {
  const email = auth.currentUser?.email;
  if (email !== OWNER_EMAIL) {
    throw new Error("Only the owner is allowed to change another user's role.");
  }
  await update(ref(getDb(), `users/${userId}`), { role });
};

/**
 * Stores the signed-in user's Google profile image URL on their `users/$id`
 * record so it can be shown in the PMS users table. Looks the record up by
 * email (records are keyed by uuid) and only writes when the URL actually
 * changed, to avoid a write on every auth refresh. Best-effort: failures
 * (e.g. an unseeded user, or write rules) are swallowed.
 */
export const storeUserProfileImage = async (email: string, photoURL?: string | null) => {
  if (!photoURL) return;

  try {
    const users = (await get(ref(getDb(), 'users'))).val() ?? {};
    const normalizedEmail = email.toLowerCase().trim();
    const entry = Object.entries(users).find(
      ([, value]) => (value as UserRecord).email?.toLowerCase().trim() === normalizedEmail,
    );
    if (!entry) return;

    const [id, existing] = entry as [string, UserRecord];
    if (existing.profileImageUrl === photoURL) return;

    await update(ref(getDb(), `users/${id}`), { profileImageUrl: photoURL });
  } catch (error) {
    console.error(error);
  }
};

/**
 * Listens for Firebase auth changes and resolves the signed-in account against
 * the `users` collection in the database (no longer a hardcoded allowlist):
 * an account is allowed only if its email matches a user record whose `role`
 * grants access (VIEWER or higher), and gets admin/edit rights only if that
 * role is MANAGER or higher. A record whose role is BLOCKED is denied access
 * entirely. Emails are matched case-insensitively. A non-allowlisted account is
 * also blocked by the database read rules, so any failure to read the users
 * list is treated as NOT_ALLOWED.
 */
export const getSignedInUser = (
  setUser: (user: User | false) => void,
  setAdmin: (isAdmin: boolean) => void,
  setError: (error: 'NOT_ALLOWED' | 'BLOCKED' | null) => void,
) =>
  onAuthStateChanged(auth, async (user) => {
    setUser(false);
    setAdmin(false);
    setError(null);

    if (!user?.email) return;

    const email = user.email.toLowerCase().trim();

    try {
      const users: Record<string, UserRecord> = (await get(ref(getDb(), 'users'))).val() ?? {};
      const match = Object.values(users).find(
        (knownUser) => knownUser.email?.toLowerCase().trim() === email,
      );

      if (!match) {
        setError('NOT_ALLOWED');
        return;
      }

      // Resolve the user's role. Records written before the enum existed may
      // still carry the legacy `isAdmin`/`blocked` booleans and no `role`; map
      // those through so access isn't lost during the transition.
      const legacy = match as { isAdmin?: boolean; blocked?: boolean };
      const role: Role =
        match.role ?? (legacy.blocked ? 'BLOCKED' : legacy.isAdmin ? 'MANAGER' : DEFAULT_ROLE);

      // BLOCKED users have a record but are denied access entirely.
      if (!canAccess(role)) {
        setError('BLOCKED');
        return;
      }

      setUser(user);
      storeUserProfileImage(user.email, user.photoURL);
      if (canEdit(role)) setAdmin(true);
    } catch (error) {
      console.error(error);
      setError('NOT_ALLOWED');
    }
  });

/**
 * Appends an entry to the `auditLog` collection (an append-only record of
 * notable account activity). Uses a Firebase push id (chronological) and a
 * server-resolved timestamp so the time can't be spoofed by a client clock.
 * Best-effort: failures (e.g. write rules) are swallowed so they never block
 * the sign-in/out flow that triggered them.
 */
export const logAuditEvent = async (event: AuditEvent, email?: string | null) => {
  if (!email) return;
  try {
    await push(ref(getDb(), 'auditLog'), { email, event, timestamp: serverTimestamp() });
  } catch (error) {
    console.error(error);
  }
};

export const logOut = (setUser: (user: User | false) => void) => {
  // Capture the email before signing out — afterwards currentUser is null.
  const email = auth.currentUser?.email;
  signOut(auth)
    .then(() => {
      logAuditEvent('LOGOUT', email);
      setUser(false);
    })
    .catch((error) => {
      console.error(error);
      setUser(false);
    });
};

export const logIn = (onError?: (errorCode: string) => void) => {
  // Log the explicit sign-in action here (not in getSignedInUser's
  // onAuthStateChanged, which also fires on every page refresh/token restore).
  signInWithPopup(auth, provider)
    .then((credential) => logAuditEvent('LOGIN', credential.user.email))
    .catch((error) => {
      console.error(error);
      onError?.(error.code);
    });
};
