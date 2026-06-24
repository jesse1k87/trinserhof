import {
  type AuditEvent,
  Booking,
  Customer,
  Product,
  ProductCategory,
  Room,
  User,
  type Role,
  canAccess,
} from '@trinserhof/types';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  push,
  remove,
  serverTimestamp,
} from 'firebase/database';
import { initializeApp } from 'firebase/app';
import {
  uuidv4,
  extractCustomersFromBookings,
  cleanupLegacyBookings as cleanupLegacyBookingsHelper,
  getBookingValidationErrors,
  getCustomerValidationErrors,
  getProductCategoryValidationErrors,
  getProductValidationErrors,
  getRoomValidationErrors,
  mergeLegacyNotes,
  seedRooms as seedRoomsHelper,
  markPastBookingsCheckedOut as markPastBookingsCheckedOutHelper,
  stripBookingCustomerData as stripBookingCustomerDataHelper,
  getYYYYmmDD,
  type ExtractCustomersResult,
  type CleanupBookingsResult,
  type RoomSeedResult,
  type CheckedOutResult,
  type StripCustomerDataResult,
} from '@trinserhof/helpers';
import { FIREBASE_CONFIG } from '@trinserhof/constants';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
export const getDb = () => db;

export {
  getBookingValidationErrors,
  getProductValidationErrors,
  getProductCategoryValidationErrors,
};

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
  if (!customer.id) {
    customer.id = uuidv4();
  }

  const validationErrors = getCustomerValidationErrors(customer);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid customer data: ${validationErrors.join(', ')}`);
  }

  await set(ref(getDb(), `customers/${customer.id}`), customer);
  return customer;
};

export const saveProduct = async (product: Product) => {
  if (!product.id) {
    product.id = uuidv4();
  }

  const validationErrors = getProductValidationErrors(product);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid product data: ${validationErrors.join(', ')}`);
  }

  await set(ref(getDb(), `products/${product.id}`), product);
  return product;
};

export const saveProductCategory = async (category: ProductCategory) => {
  if (!category.id) {
    category.id = uuidv4();
  }

  const validationErrors = getProductCategoryValidationErrors(category);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid product category data: ${validationErrors.join(', ')}`);
  }

  await set(ref(getDb(), `productCategories/${category.id}`), category);
  return category;
};

export const saveRoom = async (room: Room) => {
  const validationErrors = getRoomValidationErrors(room);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid room data: ${validationErrors.join(', ')}`);
  }

  await set(ref(getDb(), `rooms/${room.id}`), room);
  return room;
};

export const deleteRoom = async (roomId: string) => {
  const bookings: Record<string, Booking> = (await get(ref(getDb(), 'bookings'))).val() ?? {};
  const hasBookings = Object.values(bookings).some((booking) => booking.roomId === roomId);
  if (hasBookings) {
    throw new Error('This room has bookings and cannot be deleted.');
  }

  await remove(ref(getDb(), `rooms/${roomId}`));
};

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

export const stripBookingCustomerData = async ({
  apply,
}: {
  apply: boolean;
}): Promise<StripCustomerDataResult> => {
  const bookings = (await get(ref(getDb(), 'bookings'))).val() ?? {};

  const result = stripBookingCustomerDataHelper(bookings);

  if (apply) {
    const updates: Record<string, unknown> = {};
    for (const [id, removals] of Object.entries(result.bookingFieldRemovals)) {
      for (const [field, value] of Object.entries(removals)) {
        // null deletes the field from the booking.
        updates[`bookings/${id}/${field}`] = value;
      }
    }
    if (Object.keys(updates).length > 0) {
      await update(ref(getDb()), updates);
    }
  }

  return result;
};

export type LegacyBookingMigrationResult = {
  cleanup: CleanupBookingsResult;
  extractCustomers: ExtractCustomersResult;
  checkedOut: CheckedOutResult;
};

/**
 * Combines cleanup, customer extraction, and checked-out marking into a single
 * migration step, run in that order. When apply is true, each step's Firebase
 * write is visible to the next step's read, so cleanup unblocks customer
 * extraction the same way it would if run separately first.
 */
export const migrateLegacyBookings = async ({
  apply,
}: {
  apply: boolean;
}): Promise<LegacyBookingMigrationResult> => {
  const cleanup = await cleanupLegacyBookings({ apply });
  const extractCustomers = await migrateBookingsToCustomers({ apply });
  const checkedOut = await markPastBookingsCheckedOut({ apply });

  if (apply) {
    await logAuditEvent('MIGRATE_LEGACY_BOOKINGS', auth.currentUser?.email);
  }

  return { cleanup, extractCustomers, checkedOut };
};

export type RunAllMigrationsResult = {
  legacy: LegacyBookingMigrationResult;
  rooms: RoomSeedResult;
  stripCustomerData: StripCustomerDataResult;
};

/**
 * Runs every data migration as a single step, in dependency order: legacy
 * bookings first (it creates the customer links the strip step needs), then
 * room seeding, then stripping the now-redundant customer fields off bookings.
 */
export const runAllMigrations = async ({
  apply,
}: {
  apply: boolean;
}): Promise<RunAllMigrationsResult> => {
  const legacy = await migrateLegacyBookings({ apply });
  const rooms = await seedRooms({ apply });
  const stripCustomerData = await stripBookingCustomerData({ apply });

  return { legacy, rooms, stripCustomerData };
};

const auth = getAuth();
const provider = new GoogleAuthProvider();

export const overwriteRawData = async (data: unknown) => {
  const email = auth.currentUser?.email;
  if (email !== 'jesse1k87@gmail.com') {
    throw new Error('Only the owner is allowed to overwrite the raw database.');
  }
  await set(ref(getDb()), data);
};

export const setUserRole = async (userId: string, role: Role) => {
  const email = auth.currentUser?.email;
  if (email !== 'jesse1k87@gmail.com') {
    throw new Error("Only the owner is allowed to change another user's role.");
  }
  await update(ref(getDb(), `users/${userId}`), { role });
};

export const storeUserProfileImage = async (email: string, photoURL?: string | null) => {
  if (!photoURL) return;

  try {
    const users = (await get(ref(getDb(), 'users'))).val() ?? {};
    const normalizedEmail = email.toLowerCase().trim();
    const entry = Object.entries(users).find(
      ([, value]) => (value as User).email?.toLowerCase().trim() === normalizedEmail,
    );
    if (!entry) return;

    const [id, existing] = entry as [string, User];
    if (existing.image === photoURL) return;

    await update(ref(getDb(), `users/${id}`), { image: photoURL });
  } catch (error) {
    console.error(error);
  }
};

export const getSignedInUser = (
  setUser: (user: User | null) => void,
  setError: (error: 'NOT_ALLOWED' | 'BLOCKED' | null) => void,
) =>
  onAuthStateChanged(auth, async (firebaseUser) => {
    setUser(null);
    setError(null);

    if (!firebaseUser?.email) return;

    const email = firebaseUser.email.toLowerCase().trim();

    try {
      const users: Record<string, User> = (await get(ref(getDb(), 'users'))).val() ?? {};
      const user = Object.values(users).find(
        (knownUser) => knownUser.email?.toLowerCase().trim() === email,
      );

      if (!user) {
        setError('NOT_ALLOWED');
        return;
      }

      if (!canAccess(user.role)) {
        setError('BLOCKED');
        return;
      }

      setUser(user);
      storeUserProfileImage(firebaseUser.email, firebaseUser.photoURL);
    } catch (error) {
      console.error(error);
      setError('NOT_ALLOWED');
    }
  });

export const logAuditEvent = async (event: AuditEvent, email?: string | null) => {
  if (!email) return;
  try {
    await push(ref(getDb(), 'auditLog'), { email, event, timestamp: serverTimestamp() });
  } catch (error) {
    console.error(error);
  }
};

export const logOut = (setUser: (user: User | null) => void) => {
  // Capture the email before signing out — afterwards currentUser is null.
  const email = auth.currentUser?.email;
  signOut(auth)
    .then(() => {
      logAuditEvent('LOGOUT', email);
      setUser(null);
    })
    .catch((error) => {
      console.error(error);
      setUser(null);
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
