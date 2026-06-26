import { type Customer } from '@trinserhof/types';

// Every customer field that can hold a value worth carrying over during a merge.
// `id` is deliberately excluded (the surviving record keeps its own id) and
// `created` is handled separately (we keep the earliest of the two).
const MERGEABLE_FIELDS = [
  'name',
  'surname',
  'email',
  'phone',
  'dateOfBirth',
  'nationality',
  'language',
  'street',
  'streetNumber',
  'postcode',
  'city',
  'country',
] as const satisfies ReadonlyArray<keyof Customer>;

const isEmpty = (value: unknown): boolean => value === undefined || value === null || value === '';

/**
 * Combines two customers into one. The result keeps `primary`'s id, and for every
 * other field keeps `primary`'s value when it has one, otherwise falls back to
 * `secondary`'s value — i.e. a field that is filled on one record and empty on the
 * other is preserved, and `primary` wins when both have a (conflicting) value.
 * `created` is set to the earliest known creation date of the two so the merged
 * record reflects the older of the two relationships.
 */
export const mergeCustomerFields = (primary: Customer, secondary: Customer): Customer => {
  const merged: Customer = { ...primary };

  // Generic over the key so `merged[key] = secondary[key]` stays type-safe (both
  // sides are `Customer[K]`); a plain loop over the union of keys would not.
  const fillIfEmpty = <K extends keyof Customer>(key: K) => {
    if (isEmpty(merged[key]) && !isEmpty(secondary[key])) {
      merged[key] = secondary[key];
    }
  };

  for (const field of MERGEABLE_FIELDS) {
    fillIfEmpty(field);
  }

  const createdDates = [primary.created, secondary.created].filter(Boolean) as string[];
  if (createdDates.length > 0) {
    merged.created = createdDates.sort()[0];
  }

  return merged;
};
