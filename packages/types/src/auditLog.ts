import { z } from 'zod';

export const AUDIT_EVENTS = [
  'LOGIN',
  'LOGOUT',
  'BOOKING_CREATED',
  'BOOKING_UPDATED',
  'BOOKING_DELETED',
  'BOOKING_RESTORED',
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'CUSTOMER_DELETED',
  'CUSTOMER_RESTORED',
  'ROOM_CREATED',
  'ROOM_UPDATED',
  'ROOM_DELETED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_DELETED',
  'PRODUCT_RESTORED',
  'PRODUCT_CATEGORY_CREATED',
  'PRODUCT_CATEGORY_UPDATED',
  'PRODUCT_CATEGORY_DELETED',
  'PRODUCT_CATEGORY_RESTORED',
  'MIGRATE_LEGACY_BOOKINGS',
  'BOOKINGS_AND_CUSTOMERS_WIPED',
] as const;
export type AuditEvent = (typeof AUDIT_EVENTS)[number];

export type AuditLogEntry = {
  id: string;
  email: string;
  event: AuditEvent;
  timestamp: number;
};

export const auditLogEntrySchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  event: z.enum(AUDIT_EVENTS, { message: 'Invalid audit event' }),
  timestamp: z.number({ message: 'Invalid timestamp' }),
});
