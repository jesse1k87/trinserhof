import { z } from 'zod';

export const CHANNELS = [
  { id: 'UNKNOWN', label: 'Unknown' },
  { id: 'AIRBNB', label: 'Airbnb' },
  { id: 'BOOKING', label: 'Booking.com' },
  { id: 'EMAIL', label: 'E-mail' },
  { id: 'PHONE', label: 'Phone' },
  { id: 'MEWS', label: 'Mews' },
] as const;

const CHANNEL_IDS = CHANNELS.map(({ id }) => id) as [string, ...string[]];

export const ChannelsEnum = z.enum(CHANNEL_IDS);

export type Channel = z.infer<typeof ChannelsEnum>;
