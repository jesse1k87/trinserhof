export {
  type Booking,
  bookingSchema,
  type BookingStatus,
  BOOKING_STATUSES,
  DEFAULT_BOOKING_STATUS,
  DEFAULT_BOOKING_ORIGIN,
} from './booking';
export { type Customer, customerSchema } from './customer';
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
  ROLES,
  RoleEnum,
  ROLE_RANK,
  DEFAULT_ROLE,
  roleAtLeast,
  canEnterApp,
  type Entity,
  ENTITIES,
  type CrudAction,
  CRUD_ACTIONS,
  ENTITY_PERMISSIONS,
  canPerform,
} from './role';
export { type User, type Theme, THEMES, ThemeEnum, userSchema } from './user';
export { type AuditEvent, type AuditLogEntry, AUDIT_EVENTS, auditLogEntrySchema } from './auditLog';
export {
  type Room,
  type RoomId,
  type RoomTypeId,
  type RoomAmenity,
  type RoomBedCount,
  ROOM_TYPES,
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
export { type RestaurantTable, tableSchema } from './table';
export {
  type TableReservation,
  tableReservationSchema,
  TABLE_RESERVATION_DURATION_MS,
  getTableReservationEnd,
} from './tableReservation';

export const PRICE_PET_PER_NIGHT = 25;
export const CITY_TAX_PER_GUEST_PER_NIGHT = 2.6;
