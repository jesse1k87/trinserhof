import { type Customer } from '@trinserhof/types';
import { getNewCustomer } from './getNewCustomer';

/**
 * Finds the existing customer whose email matches (case/whitespace-insensitive),
 * or builds a fresh, unsaved draft seeded from the fallback name/phone so callers
 * can "quick-create" a customer record on first save.
 */
export const resolveCustomerForEmail = (
  email: string,
  customers: Customer[],
  fallback?: { name?: string; surname?: string; phone?: string },
): Customer => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = customers.find(
    (customer) => customer.email.trim().toLowerCase() === normalizedEmail,
  );
  if (existing) return existing;

  return {
    ...getNewCustomer(),
    email,
    ...(fallback?.name && { name: fallback.name }),
    ...(fallback?.surname && { surname: fallback.surname }),
    ...(fallback?.phone && { phone: fallback.phone }),
  };
};
