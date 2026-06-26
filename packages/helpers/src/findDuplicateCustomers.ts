import { type Customer } from '@trinserhof/types';

// The different signals that can make two customer records look like duplicates.
export type DuplicateMatchReason = 'EMAIL' | 'PHONE' | 'NAME' | 'NAME_EXACT';

export type DuplicateCustomerSuggestion = {
  // Stable identifier for the pair (the two customer ids sorted and joined),
  // handy as a React key and for tracking which suggestions were dismissed.
  id: string;
  customers: [Customer, Customer];
  // Why the two records are suspected duplicates, strongest signal first.
  reasons: DuplicateMatchReason[];
};

// How much each signal is trusted, used to order suggestions (and the reasons
// within a suggestion) from most to least confident.
const REASON_WEIGHT: Record<DuplicateMatchReason, number> = {
  EMAIL: 4,
  PHONE: 2,
  NAME: 1,
  // A bare-equal `name` field is the weakest signal (it can be a shared first
  // name or a placeholder), so it sorts below everything else.
  NAME_EXACT: 0.5,
};

const REASON_ORDER: DuplicateMatchReason[] = ['EMAIL', 'PHONE', 'NAME', 'NAME_EXACT'];

const normalizeEmail = (value: string | undefined): string => (value ?? '').trim().toLowerCase();

// Reduce a phone number to its dialable digits so formatting differences
// (spaces, dashes, parentheses) don't hide an otherwise identical number, and
// fold a leading international "00" prefix into the bare digits so e.g.
// "0043 123" and "+43 123" bucket together. Numbers shorter than six digits
// are treated as too weak a signal to match on.
const normalizePhone = (value: string | undefined): string => {
  const digits = (value ?? '').replace(/\D/g, '').replace(/^00/, '');
  return digits.length >= 6 ? digits : '';
};

// A name is only used as a duplicate signal when it carries at least two words
// (e.g. a first and a last name). Those words may come from a dedicated surname
// field or already live together in `name` (most records here store the full
// name there and have no surname). Matching on a single token — a bare first
// name, or a placeholder/code like "asi" — is far too noisy to trust.
const normalizeName = (customer: Customer): string => {
  const normalized = [customer.name, customer.surname]
    .map((part) => (part ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ');
  return normalized.includes(' ') ? normalized : '';
};

// The raw `name` field, normalized only for casing and whitespace. Unlike
// `normalizeName`, this matches even single-token names (e.g. "asi"), so two
// records whose `name` is literally the same value get surfaced. It only
// applies when the record has no surname — i.e. `name` holds the person's whole
// name (the common case here) — so two genuinely different people who merely
// share a first name (e.g. "Jane Doe" and "Jane Smith") aren't flagged.
const normalizeNameField = (customer: Customer): string => {
  if ((customer.surname ?? '').trim()) return '';
  return (customer.name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

/**
 * Scans a list of customers and returns pairs that look like duplicates.
 *
 * Two records are flagged when they share a normalized email, phone number,
 * full name (name + surname), or — for records with no surname — the exact same
 * `name` field (case-insensitive, including single-token names). Each pair is
 * reported once, carrying every signal that matched, and the results are
 * ordered most-confident first so the
 * strongest duplicate candidates surface at the top of the review list.
 */
export const findDuplicateCustomers = (customers: Customer[]): DuplicateCustomerSuggestion[] => {
  const pairs = new Map<
    string,
    { customers: [Customer, Customer]; reasons: Set<DuplicateMatchReason> }
  >();

  const recordMatch = (a: Customer, b: Customer, reason: DuplicateMatchReason) => {
    if (a.id === b.id) return;
    // Sort the two ids so the pair has the same key regardless of iteration order.
    const [first, second] = a.id < b.id ? [a, b] : [b, a];
    const key = `${first.id}__${second.id}`;
    const existing = pairs.get(key);
    if (existing) {
      existing.reasons.add(reason);
    } else {
      pairs.set(key, { customers: [first, second], reasons: new Set([reason]) });
    }
  };

  // Bucket customers by a normalized key and flag every pair within a bucket,
  // which avoids comparing every customer against every other one.
  const matchByKey = (getKey: (customer: Customer) => string, reason: DuplicateMatchReason) => {
    const buckets = new Map<string, Customer[]>();
    for (const customer of customers) {
      const key = getKey(customer);
      if (!key) continue;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(customer);
      else buckets.set(key, [customer]);
    }
    for (const bucket of buckets.values()) {
      for (let i = 0; i < bucket.length; i += 1) {
        for (let j = i + 1; j < bucket.length; j += 1) {
          recordMatch(bucket[i], bucket[j], reason);
        }
      }
    }
  };

  matchByKey((customer) => normalizeEmail(customer.email), 'EMAIL');
  matchByKey((customer) => normalizePhone(customer.phone), 'PHONE');
  matchByKey((customer) => normalizeName(customer), 'NAME');
  matchByKey((customer) => normalizeNameField(customer), 'NAME_EXACT');

  const scoreOf = (reasons: Set<DuplicateMatchReason>) =>
    [...reasons].reduce((total, reason) => total + REASON_WEIGHT[reason], 0);

  return [...pairs.entries()]
    .map(([id, { customers: pairCustomers, reasons }]) => {
      // A full-name match already implies the names line up, so don't also show
      // the weaker bare-`name` signal as a separate reason for the same pair.
      if (reasons.has('NAME')) reasons.delete('NAME_EXACT');
      return {
        id,
        customers: pairCustomers,
        reasons: REASON_ORDER.filter((reason) => reasons.has(reason)),
      };
    })
    .sort((a, b) => {
      const scoreDiff = scoreOf(new Set(b.reasons)) - scoreOf(new Set(a.reasons));
      if (scoreDiff !== 0) return scoreDiff;
      // Stable, deterministic tie-breaker so the list order doesn't jump around.
      return a.id.localeCompare(b.id);
    });
};
