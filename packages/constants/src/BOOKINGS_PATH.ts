export const BOOKINGS_PATH = process.env.FIREBASE_DB_NAMESPACE
  ? `${process.env.FIREBASE_DB_NAMESPACE}-bookings`
  : 'bookings';
