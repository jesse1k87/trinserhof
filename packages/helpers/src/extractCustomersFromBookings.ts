import { Booking, Customer } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export type CustomerSuggestion = {
  reason: string;
  customers: Array<Pick<Customer, 'id' | 'name' | 'email' | 'phone'>>;
};

export type ExtractCustomersResult = {
  /** New or merged customer records only, keyed by id (safe to write directly). */
  changedCustomers: Record<string, Customer>;
  /** bookingId -> [customerId] for bookings that gained a customer link. */
  bookingCustomerUpdates: Record<string, string[]>;
  summary: {
    migratedCount: number;
    newCustomersCount: number;
    mergedCustomersCount: number;
  };
  /** Heuristic duplicate-customer pairs for manual review (not acted on). */
  suggestions: CustomerSuggestion[];
};

/**
 * Pure port of scripts/migrate-bookings-to-customers.mjs: extracts a separate
 * `customers` collection from booking data. No Firebase / no fs — given the
 * current bookings and customers maps, it returns the records to write and the
 * booking links to set, plus heuristic duplicate suggestions for manual review.
 *
 * Idempotent: bookings that already have a non-empty `customers` array are skipped.
 */
export const extractCustomersFromBookings = (
  bookings: Record<string, Booking>,
  existingCustomers: Record<string, Customer>,
): ExtractCustomersResult => {
  // Work on shallow copies so callers' maps aren't mutated.
  const customers: Record<string, Customer> = { ...existingCustomers };
  const changedCustomers: Record<string, Customer> = {};
  const bookingCustomerUpdates: Record<string, string[]> = {};
  // Mirrors `bookings` but reflects customer links created in this run, so
  // findDuplicateSuggestions below can see bookings linked to brand-new
  // customers (the input `bookings` map itself is never written to).
  const linkedBookings: Record<string, Booking> = { ...bookings };

  // Index existing customers by normalized email.
  const emailToCustomerId = new Map<string, string>();
  for (const [id, customer] of Object.entries(customers)) {
    if (customer.email) {
      emailToCustomerId.set(customer.email.toLowerCase().trim(), id);
    }
  }

  let migratedCount = 0;
  let newCustomersCount = 0;
  let mergedCustomersCount = 0;

  for (const [bookingId, booking] of Object.entries(bookings)) {
    if (Array.isArray(booking.customers) && booking.customers.length > 0) {
      continue;
    }

    const rawEmail = booking.email ?? booking.contact;
    if (!rawEmail) continue;

    const normalizedEmail = rawEmail.toLowerCase().trim();

    // Fallback for the display name: name, then legacy content, then group.
    const extractedName = booking.name || booking.content || booking.group || '';
    const newName = extractedName ? String(extractedName).trim() : '';

    let customerId: string;

    if (emailToCustomerId.has(normalizedEmail)) {
      // Existing customer: merge data.
      customerId = emailToCustomerId.get(normalizedEmail)!;
      const existingCustomer = customers[customerId];

      if (newName) {
        // Avoid duplicate names in the comma-separated string.
        const currentNames = existingCustomer.name
          ? existingCustomer.name.split(',').map((n) => n.trim())
          : [];

        if (!currentNames.includes(newName)) {
          existingCustomer.name = existingCustomer.name
            ? `${existingCustomer.name}, ${newName}`
            : newName;
        }
      }

      // Backfill phone if the existing record lacks one.
      if (!existingCustomer.phone && booking.phone) {
        existingCustomer.phone = booking.phone;
      }

      changedCustomers[customerId] = existingCustomer;
      mergedCustomersCount++;
    } else {
      // New customer.
      customerId = uuidv4();

      const customer: Customer = {
        id: customerId,
        name: newName,
        email: rawEmail, // Preserve original casing for the record.
        ...(booking.phone ? { phone: booking.phone } : {}),
      };

      customers[customerId] = customer;
      changedCustomers[customerId] = customer;
      emailToCustomerId.set(normalizedEmail, customerId);
      newCustomersCount++;
    }

    bookingCustomerUpdates[bookingId] = [customerId];
    linkedBookings[bookingId] = { ...booking, customers: [customerId] };
    migratedCount++;
  }

  const suggestions = findDuplicateSuggestions(linkedBookings, customers);

  return {
    changedCustomers,
    bookingCustomerUpdates,
    summary: { migratedCount, newCustomersCount, mergedCustomersCount },
    suggestions,
  };
};

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  normName: string;
  normPhone: string;
  textCorpus: string;
};

const getSharedWords = (str1: string, str2: string) => {
  const words1 = str1.split(' ').filter((w) => w.length > 4);
  const words2 = str2.split(' ').filter((w) => w.length > 4);
  return words1.filter((w) => words2.includes(w));
};

/**
 * Heuristic pairwise comparison to surface likely-duplicate customers (same
 * person under different emails). For manual review only — never auto-merged.
 */
const findDuplicateSuggestions = (
  bookings: Record<string, Booking>,
  customers: Record<string, Customer>,
): CustomerSuggestion[] => {
  const suggestions: CustomerSuggestion[] = [];
  const allBookings = Object.values(bookings);

  const profiles: Profile[] = Object.values(customers).map((c) => {
    const relatedBookings = allBookings.filter((b) => b.customers?.includes(c.id));

    const corpusParts: string[] = [];
    for (const b of relatedBookings) {
      if (b.notes) corpusParts.push(b.notes);
      if (b.message) corpusParts.push(b.message);
      if (b.content) corpusParts.push(b.content);
      if (b.group) corpusParts.push(b.group);
    }

    return {
      id: c.id,
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      normName: c.name ? c.name.toLowerCase().replace(/\s+/g, ' ').trim() : '',
      normPhone: c.phone ? c.phone.replace(/[^0-9+]/g, '') : '',
      textCorpus: corpusParts.join(' ').toLowerCase(),
    };
  });

  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const c1 = profiles[i];
      const c2 = profiles[j];

      let matchReason: string | null = null;

      // A: Phone matching (exact, or substring if long enough).
      if (c1.normPhone && c2.normPhone) {
        if (c1.normPhone === c2.normPhone) {
          matchReason = `Exact phone match: ${c1.phone}`;
        } else if (
          c1.normPhone.length > 7 &&
          c2.normPhone.length > 7 &&
          (c1.normPhone.includes(c2.normPhone) || c2.normPhone.includes(c1.normPhone))
        ) {
          matchReason = `Partial phone match: ${c1.phone} / ${c2.phone}`;
        }
      }

      // B: Name matching (substring or shared words).
      if (!matchReason && c1.normName && c2.normName) {
        if (c1.normName === c2.normName) {
          matchReason = `Exact name match: "${c1.name}"`;
        } else if (c1.normName.length > 5 && c2.normName.includes(c1.normName)) {
          matchReason = `Partial name match: "${c1.name}" is inside "${c2.name}"`;
        } else if (c2.normName.length > 5 && c1.normName.includes(c2.normName)) {
          matchReason = `Partial name match: "${c2.name}" is inside "${c1.name}"`;
        } else {
          const sharedWords = getSharedWords(c1.normName, c2.normName);
          if (sharedWords.length > 0) {
            matchReason = `Shared name part(s): "${sharedWords.join(', ')}"`;
          }
        }
      }

      // C: Cross-references in booking text fields (notes, message, group, content).
      if (!matchReason) {
        if (c1.email && c2.textCorpus.includes(c1.email.toLowerCase())) {
          matchReason = `Email "${c1.email}" found in other customer's booking notes/text`;
        } else if (c2.email && c1.textCorpus.includes(c2.email.toLowerCase())) {
          matchReason = `Email "${c2.email}" found in other customer's booking notes/text`;
        } else if (c1.normName && c1.normName.length > 5 && c2.textCorpus.includes(c1.normName)) {
          matchReason = `Name "${c1.name}" found in other customer's booking notes/text`;
        } else if (c2.normName && c2.normName.length > 5 && c1.textCorpus.includes(c2.normName)) {
          matchReason = `Name "${c2.name}" found in other customer's booking notes/text`;
        }
      }

      if (matchReason) {
        suggestions.push({
          reason: matchReason,
          customers: [
            { id: c1.id, name: c1.name, email: c1.email, phone: c1.phone },
            { id: c2.id, name: c2.name, email: c2.email, phone: c2.phone },
          ],
        });
      }
    }
  }

  return suggestions;
};
