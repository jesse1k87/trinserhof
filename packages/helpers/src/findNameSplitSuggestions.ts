import { type Customer } from '@trinserhof/types';

// A customer whose `surname` is empty but whose `name` looks like it holds a
// first name *and* a surname together (e.g. "Elke Wimmer"). We suggest splitting
// the trailing word off into the `surname` field so the record is stored the way
// the rest of the app expects (separate name/surname).
export type NameSplitSuggestion = {
  // The customer id doubles as the suggestion id (one suggestion per record),
  // handy as a React key and for tracking which suggestions were dismissed.
  id: string;
  customer: Customer;
  // The name with the trailing word removed, e.g. "Elke" (or "Maria Anna" for a
  // three-word name).
  suggestedName: string;
  // The trailing word, treated as the surname, e.g. "Wimmer".
  suggestedSurname: string;
};

const hasSurname = (customer: Customer): boolean => (customer.surname ?? '').trim().length > 0;

/**
 * Scans a list of customers and returns suggestions to split a combined
 * "first last" value out of `name` into separate `name`/`surname` fields.
 *
 * A record is flagged when it has no surname yet its `name` contains at least two
 * whitespace-separated words. The last word becomes the suggested surname and the
 * remaining words stay as the suggested name. Single-word names (a bare first
 * name, or a placeholder/code) are left alone — there's nothing to split.
 */
export const findNameSplitSuggestions = (customers: Customer[]): NameSplitSuggestion[] =>
  customers.reduce<NameSplitSuggestion[]>((suggestions, customer) => {
    if (hasSurname(customer)) return suggestions;

    const words = (customer.name ?? '').trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) return suggestions;

    const suggestedSurname = words[words.length - 1];
    const suggestedName = words.slice(0, -1).join(' ');

    suggestions.push({ id: customer.id, customer, suggestedName, suggestedSurname });
    return suggestions;
  }, []);
