import { Booking, CHANNELS } from '@trinserhof/types';

export type Customer = {
  email: string;
  name?: string;
  phone?: string;
  bookingsCount: number;
  totalSpent: number;
  lastStay: string;
  channels: string[];
};

export const getCustomers = (bookings: Booking[]): Customer[] => {
  const customersByEmail = new Map<string, Customer>();

  for (const booking of bookings) {
    const email = booking.email?.trim().toLowerCase();
    if (!email) continue;

    const channelLabel = CHANNELS.find((c) => c.id === booking.channel)?.label ?? booking.channel;
    const existing = customersByEmail.get(email);

    if (!existing) {
      customersByEmail.set(email, {
        email: booking.email,
        name: booking.name,
        phone: booking.phone,
        bookingsCount: 1,
        totalSpent: booking.price ?? 0,
        lastStay: booking.checkIn,
        channels: [channelLabel],
      });
      continue;
    }

    existing.name = booking.name || existing.name;
    existing.phone = booking.phone || existing.phone;
    existing.bookingsCount += 1;
    existing.totalSpent += booking.price ?? 0;
    if (booking.checkIn > existing.lastStay) existing.lastStay = booking.checkIn;
    if (!existing.channels.includes(channelLabel)) existing.channels.push(channelLabel);
  }

  return Array.from(customersByEmail.values());
};
