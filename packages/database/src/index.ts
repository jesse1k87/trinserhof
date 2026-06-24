import {
  type AuditEvent,
  Booking,
  Customer,
  Product,
  AccountingCategory,
  Room,
  User,
  type Role,
  type Theme,
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
  getBookingValidationErrors,
  getCustomerValidationErrors,
  getAccountingCategoryValidationErrors,
  getProductValidationErrors,
  getRoomValidationErrors,
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

export const deleteBooking = async (bookingId: string) => {
  await remove(ref(getDb(), `bookings/${bookingId}`));
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

export const saveAccountingCategory = async (category: AccountingCategory) => {
  if (!category.id) {
    category.id = uuidv4();
  }

  const validationErrors = getAccountingCategoryValidationErrors(category);
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

export type WipeBookingsAndCustomersResult = {
  bookingsDeleted: number;
  customersDeleted: number;
};

export const wipeBookingsAndCustomers = async (): Promise<WipeBookingsAndCustomersResult> => {
  const bookings: Record<string, Booking> = (await get(ref(getDb(), 'bookings'))).val() ?? {};
  const customers: Record<string, Customer> = (await get(ref(getDb(), 'customers'))).val() ?? {};

  await update(ref(getDb()), { bookings: null, customers: null });
  await logAuditEvent('BOOKINGS_AND_CUSTOMERS_WIPED', auth.currentUser?.email);

  return {
    bookingsDeleted: Object.keys(bookings).length,
    customersDeleted: Object.keys(customers).length,
  };
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
  setError: (error: 'NOT_ALLOWED' | 'BLOCKED' | null) => void,
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
