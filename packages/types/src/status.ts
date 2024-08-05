import { z } from 'zod';

export const STATUSES = ['DRAFT', 'PENDING', 'CONFIRMED', 'PAID', 'DECLINED', 'BLOCKED'] as const;

export const StatusEnum = z.enum(STATUSES);

export type Status = z.infer<typeof StatusEnum>;
