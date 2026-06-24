import { z } from 'zod';

export const STATUSES = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'CHECKED_IN', label: 'Checked in' },
  { id: 'CHECKED_OUT', label: 'Checked out' },
  { id: 'PAID', label: 'Paid' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'BLOCKED', label: 'Blocked' },
  { id: 'NO_STATUS', label: 'No status' },
] as const;

const STATUS_IDS = STATUSES.map(({ id }) => id) as [string, ...string[]];

export const StatusEnum = z.enum(STATUS_IDS);

export type Status = z.infer<typeof StatusEnum>;
