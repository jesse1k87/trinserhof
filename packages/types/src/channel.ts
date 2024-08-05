import { z } from 'zod';

export const CHANNELS = ['UNKNOWN', 'EMAIL', 'PHONE', 'AIRBNB', 'BOOKING'] as const;

export const ChannelsEnum = z.enum(CHANNELS);

export type Channel = z.infer<typeof ChannelsEnum>;
