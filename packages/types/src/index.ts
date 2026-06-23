export { type Booking, type OldBooking, bookingSchema } from './booking';
export { type Customer, customerSchema } from './customer';
export { type Status, STATUSES } from './status';
export { type Channel, CHANNELS } from './channel';
export {
  type Role,
  ROLES,
  RoleEnum,
  ROLE_RANK,
  DEFAULT_ROLE,
  roleAtLeast,
  canEdit,
  canAccess,
} from './role';
export { type User, userSchema } from './user';
export { type AuditEvent, type AuditLogEntry, AUDIT_EVENTS, auditLogEntrySchema } from './auditLog';
export {
  type Room,
  type RoomId,
  type RoomTypeId,
  ROOMS,
  ROOM_TYPES,
  defaultRoomId,
  ROOM_IDS,
} from './room';

export const PRICE_PET_PER_NIGHT = 25;
