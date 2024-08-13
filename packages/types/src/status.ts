import { z } from 'zod';

export const STATUSES = ['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'BLOCKED'] as const;

export const StatusEnum = z.enum(STATUSES);

export type Status = z.infer<typeof StatusEnum>;
