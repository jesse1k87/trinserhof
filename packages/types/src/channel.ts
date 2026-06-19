import { z } from 'zod';

export const CHANNELS: Array<{ id: string; label: string }> = [
  { id: 'UNKNOWN', label: 'Unknown' },
  { id: 'AIRBNB', label: 'Airbnb' },
  { id: 'BOOKING', label: 'Booking.com' },
  { id: 'EMAIL', label: 'E-mail' },
  { id: 'PHONE', label: 'Phone' },
  { id: 'MEWS', label: 'Mews' },
] as const;

export const ChannelsEnum = z.enum(CHANNELS.map(({ id }) => id));

export type Channel = z.infer<typeof ChannelsEnum>;
