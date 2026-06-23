import { describe, expect, it } from 'vitest';
import { Booking, Customer } from '@trinserhof/types';
import { extractCustomersFromBookings } from './extractCustomersFromBookings';

// The function only reads a handful of fields; build minimal booking-shaped
// objects and cast rather than spelling out every required Booking field.
const booking = (b: Partial<Booking>): Booking => b as Booking;

describe('extractCustomersFromBookings', () => {
  it('creates a new customer for a booking with no customer link', () => {
    const result = extractCustomersFromBookings(
      { b1: booking({ id: 'b1', email: 'Anna@Example.com', name: 'Anna', phone: '123' }) },
      {},
    );

    expect(result.summary).toEqual({
      migratedCount: 1,
      newCustomersCount: 1,
      mergedCustomersCount: 0,
    });

    const created = Object.values(result.changedCustomers)[0];
    expect(created.name).toBe('Anna');
    expect(created.email).toBe('Anna@Example.com'); // original casing preserved
    expect(created.phone).toBe('123');
    expect(result.bookingCustomerUpdates).toEqual({ b1: [created.id] });
  });

  it('merges a booking into an existing customer matched by normalized email', () => {
    const existing: Record<string, Customer> = {
      c1: { id: 'c1', name: 'Anna', email: 'anna@example.com' },
    };

    const result = extractCustomersFromBookings(
      { b1: booking({ id: 'b1', email: '  ANNA@example.com ', name: 'Anna Smith', phone: '999' }) },
      existing,
    );

    expect(result.summary).toEqual({
      migratedCount: 1,
      newCustomersCount: 0,
      mergedCustomersCount: 1,
    });
    expect(result.changedCustomers.c1.name).toBe('Anna, Anna Smith'); // appended, deduped
    expect(result.changedCustomers.c1.phone).toBe('999'); // backfilled
    expect(result.bookingCustomerUpdates).toEqual({ b1: ['c1'] });
  });

  it('skips bookings that already have a customer link (idempotent)', () => {
    const result = extractCustomersFromBookings(
      { b1: booking({ id: 'b1', email: 'anna@example.com', customers: ['c1'] }) },
      { c1: { id: 'c1', name: 'Anna', email: 'anna@example.com' } },
    );

    expect(result.summary.migratedCount).toBe(0);
    expect(result.bookingCustomerUpdates).toEqual({});
    expect(result.changedCustomers).toEqual({});
  });

  it('falls back to legacy contact/content fields for email and name', () => {
    const result = extractCustomersFromBookings(
      { b1: booking({ id: 'b1', contact: 'legacy@example.com', content: 'Legacy Name' }) },
      {},
    );

    const created = Object.values(result.changedCustomers)[0];
    expect(created.email).toBe('legacy@example.com');
    expect(created.name).toBe('Legacy Name');
  });

  it('ignores bookings without any email', () => {
    const result = extractCustomersFromBookings(
      { b1: booking({ id: 'b1', name: 'No Email' }) },
      {},
    );
    expect(result.summary.migratedCount).toBe(0);
    expect(result.changedCustomers).toEqual({});
  });

  it('links a freshly created customer to its booking before running duplicate detection', () => {
    // Both customers are created in this same run (no existing customers), and
    // b2's notes reference b1's email. The cross-reference check in
    // findDuplicateSuggestions can only see that if the newly created customer
    // is already linked back to its booking by the time suggestions run.
    const result = extractCustomersFromBookings(
      {
        b1: booking({ id: 'b1', email: 'alpha@example.com', name: 'Alpha' }),
        b2: booking({
          id: 'b2',
          email: 'beta@example.com',
          name: 'Beta',
          notes: 'Asked to be contacted via alpha@example.com instead.',
        }),
      },
      {},
    );

    const crossRefSuggestion = result.suggestions.find((s) =>
      /found in other customer's booking notes\/text/i.test(s.reason),
    );
    expect(crossRefSuggestion).toBeDefined();
  });

  it('surfaces a duplicate suggestion for two customers sharing a phone number', () => {
    const result = extractCustomersFromBookings(
      {
        b1: booking({ id: 'b1', email: 'a@example.com', name: 'Alpha', phone: '+41 79 123 45 67' }),
        b2: booking({ id: 'b2', email: 'b@example.com', name: 'Beta', phone: '+41791234567' }),
      },
      {},
    );

    expect(result.suggestions.length).toBeGreaterThan(0);
    const phoneSuggestion = result.suggestions.find((s) => /phone/i.test(s.reason));
    expect(phoneSuggestion).toBeDefined();
    expect(phoneSuggestion?.customers).toHaveLength(2);
  });
});
