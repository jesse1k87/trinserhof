import { z } from 'zod';

export const STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'PAID',
  'CANCELLED',
  'BLOCKED',
  'NO_STATUS',
] as const;

export const StatusEnum = z.enum(STATUSES);

export type Status = z.infer<typeof StatusEnum>;
