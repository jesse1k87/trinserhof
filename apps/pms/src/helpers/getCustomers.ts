import { Booking, Customer as RealCustomer } from '@trinserhof/types';

export type Customer = {
  email: string;
  name?: string;
  phone?: string;
};

export const getCustomers = (bookings: Booking[], realCustomers: RealCustomer[]): Customer[] => {
  const realCustomersById = new Map(realCustomers.map((c) => [c.id, c]));
  const customersByEmail = new Map<string, Customer>();

  for (const booking of bookings) {
    const email = booking.email?.trim().toLowerCase();
    if (!email) continue;

    const linkedCustomer = booking.customers
      ?.map((id) => realCustomersById.get(id))
      .find((c): c is RealCustomer => Boolean(c));
    const name = linkedCustomer
      ? [linkedCustomer.name, linkedCustomer.surname].filter(Boolean).join(' ')
      : undefined;

    const existing = customersByEmail.get(email);

    if (!existing) {
      customersByEmail.set(email, {
        email: booking.email,
        name,
        phone: booking.phone,
      });
      continue;
    }

    existing.name = name || existing.name;
    existing.phone = booking.phone || existing.phone;
  }

  for (const realCustomer of realCustomers) {
    const email = realCustomer.email?.trim().toLowerCase();
    if (!email || customersByEmail.has(email)) continue;

    customersByEmail.set(email, {
      email: realCustomer.email,
      name: [realCustomer.name, realCustomer.surname].filter(Boolean).join(' '),
      phone: realCustomer.phone,
    });
  }

  return Array.from(customersByEmail.values());
};
