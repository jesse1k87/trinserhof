export {
  type Booking,
  bookingSchema,
  type BookingStatus,
  BOOKING_STATUSES,
  DEFAULT_BOOKING_STATUS,
  DEFAULT_BOOKING_ORIGIN,
} from './booking';
export { type Customer, customerSchema } from './customer';
export { type Invoice, type InvoiceProduct, invoiceProductSchema, invoiceSchema } from './invoice';
export { type Product, type ProductVariant, productSchema } from './product';
export {
  type AccountingCategory,
  type TaxRate,
  TAX_RATES,
  HEX_COLOR_REGEX,
  accountingCategorySchema,
} from './accountingCategory';
export { type Channel, CHANNELS } from './channel';
export {
  type Role,
  RoleEnum,
  DEFAULT_ROLE,
  roleAtLeast,
  canEnterApp,
  ENTITY_PERMISSIONS,
  canPerform,
  canMergeCustomers,
} from './role';
export { type User, type Theme, THEMES, ThemeEnum, userSchema } from './user';
export { type AuditEvent, type AuditLogEntry, AUDIT_EVENTS, auditLogEntrySchema } from './auditLog';
export {
  type Room,
  type RoomId,
  type RoomType,
  type RoomTypeId,
  type RoomAmenity,
  type RoomBedCount,
  roomTypeSchema,
  ROOM_AMENITIES,
  ROOM_BED_COUNTS,
} from './room';
export {
  type Prices,
  type RoomTypePriceMap,
  EMPTY_PRICES,
  priceAmountSchema,
  pricesSchema,
} from './price';
export { type RestaurantTable, restaurantTableSchema } from './restaurantTable';
export {
  type RestaurantReservation,
  restaurantReservationSchema,
  TABLE_RESERVATION_DURATION_MS,
  getRestaurantReservationEnd,
} from './restaurantReservation';

export const PRICE_PET_PER_NIGHT = 25;
export const CITY_TAX_PER_GUEST_PER_NIGHT = 2.6;
