import { z } from 'zod';

export const AUDIT_EVENTS = [
  'LOGIN',
  'LOGOUT',
  'BOOKING_CREATED',
  'BOOKING_UPDATED',
  'BOOKING_RESTORED',
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'CUSTOMERS_MERGED',
  'INVOICE_CREATED',
  'INVOICE_UPDATED',
  'ROLE_CREATED',
  'ROLE_UPDATED',
  'ROOM_CREATED',
  'ROOM_UPDATED',
  'ROOM_TYPE_CREATED',
  'ROOM_TYPE_UPDATED',
  'PRICE_BASE_UPDATED',
  'PRICE_OVERRIDE_SET',
  'PRICE_OVERRIDE_REMOVED',
  'TABLE_CREATED',
  'TABLE_UPDATED',
  'TABLE_RESERVATION_CREATED',
  'TABLE_RESERVATION_UPDATED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_RESTORED',
  'ACCOUNTING_CATEGORY_CREATED',
  'ACCOUNTING_CATEGORY_UPDATED',
  'ACCOUNTING_CATEGORY_RESTORED',
  'MIGRATE_LEGACY_BOOKINGS',
  'BOOKINGS_WIPED',
  'BOOKINGS_IMPORTED',
  'CUSTOMERS_WIPED',
  'ROOMS_WIPED',
  'PROPERTY_CREATED',
  'PROPERTY_UPDATED',
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
