import {
  type AuditEvent,
  Booking,
  Customer,
  Product,
  AccountingCategory,
  Room,
  type RoomTypeId,
  RestaurantTable,
  TableReservation,
  User,
  type Role,
  type Theme,
  canEnterApp,
  canPerform,
  priceAmountSchema,
  userSchema,
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
  getBookingValidationErrors,
  getCustomerValidationErrors,
  getAccountingCategoryValidationErrors,
  getProductValidationErrors,
  getRoomValidationErrors,
  getTableValidationErrors,
  getTableReservationValidationErrors,
  mergeCustomerFields,
} from '@trinserhof/helpers';
import { FIREBASE_CONFIG } from '@trinserhof/constants';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
export const getDb = () => db;

export {
  getBookingValidationErrors,
  getProductValidationErrors,
  getAccountingCategoryValidationErrors,
};

export const saveBooking = async (booking: Booking) => {
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

export type MergeCustomersResult = {
  survivor: Customer;
  bookingsUpdated: number;
  tableReservationsUpdated: number;
};

// Merges `secondary` into `primary`. The surviving record keeps `primary`'s id and
// fills any of its empty fields from `secondary` (see `mergeCustomerFields`). Every
// reference to `secondary`'s id elsewhere in the database — bookings' `customers`
// arrays and table reservations' `customerId` — is repointed at `primary`'s id, and
// `secondary` is deleted. All writes go out in a single multi-path update so the
// merge is atomic: callers never observe a dangling reference to the removed
// customer.
export const mergeCustomers = async (
  primary: Customer,
  secondary: Customer,
): Promise<MergeCustomersResult> => {
  if (primary.id === secondary.id) {
    throw new Error('Cannot merge a customer into itself.');
  }

  const survivor = mergeCustomerFields(primary, secondary);

  const validationErrors = getCustomerValidationErrors(survivor);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid customer data: ${validationErrors.join(', ')}`);
  }

  const updates: Record<string, unknown> = {
    [`customers/${survivor.id}`]: survivor,
    [`customers/${secondary.id}`]: null,
  };

  const bookings: Record<string, Booking> = (await get(ref(getDb(), 'bookings'))).val() ?? {};
  let bookingsUpdated = 0;
  for (const [bookingId, booking] of Object.entries(bookings)) {
    if (!Array.isArray(booking.customers) || !booking.customers.includes(secondary.id)) {
      continue;
    }
    const repointed = booking.customers.map((id) => (id === secondary.id ? primary.id : id));
    // De-dupe in case the booking already referenced the surviving customer too.
    const deduped = repointed.filter((id, index) => repointed.indexOf(id) === index);
    updates[`bookings/${bookingId}/customers`] = deduped;
    bookingsUpdated += 1;
  }

  const tableReservations: Record<string, TableReservation> =
    (await get(ref(getDb(), 'tableReservations'))).val() ?? {};
  let tableReservationsUpdated = 0;
  for (const [reservationId, reservation] of Object.entries(tableReservations)) {
    if (reservation.customerId !== secondary.id) continue;
    updates[`tableReservations/${reservationId}/customerId`] = primary.id;
    tableReservationsUpdated += 1;
  }

  await update(ref(getDb()), updates);

  return { survivor, bookingsUpdated, tableReservationsUpdated };
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

export const saveAccountingCategory = async (category: AccountingCategory) => {
  if (!category.id) {
    category.id = uuidv4();
  }

  const validationErrors = getAccountingCategoryValidationErrors(category);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid accounting category data: ${validationErrors.join(', ')}`);
  }

  await set(ref(getDb(), `accountingCategories/${category.id}`), category);
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

// Pricing is stored under a single `prices` node, separate from the per-room
// `rooms` collection, because base prices and overrides are keyed by room *type*
// (and by night), not by individual room:
//   prices/base/<roomTypeId>                   = number
//   prices/overrides/<YYYY-MM-DD>/<roomTypeId> = number
const assertValidPriceAmount = (price: number) => {
  const result = priceAmountSchema.safeParse(price);
  if (!result.success) {
    throw new Error(`Invalid price data: ${result.error.issues.map((i) => i.message).join(', ')}`);
  }
};

export const saveBasePrice = async (roomType: RoomTypeId, price: number) => {
  assertValidPriceAmount(price);
  await set(ref(getDb(), `prices/base/${roomType}`), price);
};

export const savePriceOverride = async (date: string, roomType: RoomTypeId, price: number) => {
  assertValidPriceAmount(price);
  await set(ref(getDb(), `prices/overrides/${date}/${roomType}`), price);
};

export const deletePriceOverride = async (date: string, roomType: RoomTypeId) => {
  await remove(ref(getDb(), `prices/overrides/${date}/${roomType}`));
};

export const saveTable = async (table: RestaurantTable) => {
  if (!table.id) {
    table.id = uuidv4();
  }

  const validationErrors = getTableValidationErrors(table);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid table data: ${validationErrors.join(', ')}`);
  }

  await set(ref(getDb(), `tables/${table.id}`), table);
  return table;
};

export const deleteTable = async (tableId: string) => {
  await remove(ref(getDb(), `tables/${tableId}`));
};

export const saveTableReservation = async (tableReservation: TableReservation) => {
  if (!tableReservation.id) {
    tableReservation.id = uuidv4();
  }

  const validationErrors = getTableReservationValidationErrors(tableReservation);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid table reservation data: ${validationErrors.join(', ')}`);
  }

  if (!tableReservation.tableId) {
    delete tableReservation.tableId;
  }

  await set(ref(getDb(), `tableReservations/${tableReservation.id}`), tableReservation);
  return tableReservation;
};

export const deleteTableReservation = async (tableReservationId: string) => {
  await remove(ref(getDb(), `tableReservations/${tableReservationId}`));
};

export type WipeBookingsResult = {
  bookingsDeleted: number;
  tableReservationsDeleted: number;
  auditLogEntriesDeleted: number;
};

export const wipeBookings = async (): Promise<WipeBookingsResult> => {
  const bookings: Record<string, Booking> = (await get(ref(getDb(), 'bookings'))).val() ?? {};
  const tableReservations: Record<string, TableReservation> =
    (await get(ref(getDb(), 'tableReservations'))).val() ?? {};
  const auditLog: Record<string, unknown> = (await get(ref(getDb(), 'auditLog'))).val() ?? {};

  await update(ref(getDb()), {
    bookings: null,
    tableReservations: null,
    auditLog: null,
  });
  await logAuditEvent('BOOKINGS_WIPED', auth.currentUser?.email);

  return {
    bookingsDeleted: Object.keys(bookings).length,
    tableReservationsDeleted: Object.keys(tableReservations).length,
    auditLogEntriesDeleted: Object.keys(auditLog).length,
  };
};

export type WipeCustomersResult = {
  customersDeleted: number;
};

export const wipeCustomers = async (): Promise<WipeCustomersResult> => {
  const customers: Record<string, Customer> = (await get(ref(getDb(), 'customers'))).val() ?? {};

  await remove(ref(getDb(), 'customers'));
  await logAuditEvent('CUSTOMERS_WIPED', auth.currentUser?.email);

  return { customersDeleted: Object.keys(customers).length };
};

export type ImportBookingsResult = {
  imported: number;
  skipped: Array<{ id: string; errors: string[] }>;
};

// Bulk-imports bookings under bookings/<id> using chunked multi-path updates
// (one network round-trip per chunk rather than one per booking). A booking
// whose id already exists is overwritten. Records that fail validation are
// skipped and returned so the caller can report them instead of aborting the
// whole import.
export const importBookings = async (bookings: Booking[]): Promise<ImportBookingsResult> => {
  const valid: Booking[] = [];
  const skipped: Array<{ id: string; errors: string[] }> = [];

  for (const booking of bookings) {
    if (!booking.id) {
      booking.id = uuidv4();
    }
    const errors = getBookingValidationErrors(booking);
    if (errors.length > 0) {
      skipped.push({ id: booking.id || '(no id)', errors });
    } else {
      valid.push(booking);
    }
  }

  const CHUNK_SIZE = 500;
  for (let start = 0; start < valid.length; start += CHUNK_SIZE) {
    const updates: Record<string, Booking> = {};
    for (const booking of valid.slice(start, start + CHUNK_SIZE)) {
      updates[`bookings/${booking.id}`] = booking;
    }
    await update(ref(getDb()), updates);
  }

  if (valid.length > 0) {
    await logAuditEvent('BOOKINGS_IMPORTED', auth.currentUser?.email);
  }

  return { imported: valid.length, skipped };
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

export const addUser = async (email: string, role: Role) => {
  const actorEmail = auth.currentUser?.email;
  if (!actorEmail) {
    throw new Error('You must be signed in to add a user.');
  }

  const users: Record<string, User> = (await get(ref(getDb(), 'users'))).val() ?? {};
  const normalizedActorEmail = actorEmail.toLowerCase().trim();
  const actor = Object.values(users).find(
    (existing) => existing.email?.toLowerCase().trim() === normalizedActorEmail,
  );

  if (!actor || !canPerform(actor.role, 'USER', 'CREATE')) {
    throw new Error('Only an owner is allowed to add new users.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const alreadyExists = Object.values(users).some(
    (existing) => existing.email?.toLowerCase().trim() === normalizedEmail,
  );
  if (alreadyExists) {
    throw new Error('A user with this email already exists.');
  }

  const newUser: User = { id: uuidv4(), email: normalizedEmail, role };

  const validation = userSchema.safeParse(newUser);
  if (!validation.success) {
    throw new Error(
      `Invalid user data: ${validation.error.issues.map((issue) => issue.message).join(', ')}`,
    );
  }

  await set(ref(getDb(), `users/${newUser.id}`), newUser);
  return newUser;
};

export const setUserTheme = async (userId: string, theme: Theme) => {
  await update(ref(getDb(), `users/${userId}`), { theme });
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
  setError: (error: 'NOT_ALLOWED' | 'BLOCKED' | 'ERROR' | null) => void,
) =>
  onAuthStateChanged(auth, async (firebaseUser) => {
    setError(null);

    if (!firebaseUser?.email) {
      setUser(null);
      return;
    }

    // Keep the caller's "loading" state (e.g. undefined) instead of flashing
    // to null/logged-out while we look up whether this Firebase account is a
    // known, allowed user.
    const email = firebaseUser.email.toLowerCase().trim();

    try {
      const users: Record<string, User> = (await get(ref(getDb(), 'users'))).val() ?? {};
      let user = Object.values(users).find(
        (knownUser) => knownUser.email?.toLowerCase().trim() === email,
      );
      if (!user) {
        const newUser: User = { id: uuidv4(), email, role: 'BLOCKED' };
        await set(ref(getDb(), `users/${newUser.id}`), newUser);
        user = newUser;
      }

      if (!canEnterApp(user.role)) {
        setError('NOT_ALLOWED');
        return;
      }

      if (user.role === 'BLOCKED') {
        setError('BLOCKED');
        return;
      }

      setUser(user);
      storeUserProfileImage(firebaseUser.email, firebaseUser.photoURL);
    } catch (error) {
      console.error(error);
      setError('ERROR');
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
