import { describe, expect, it } from 'vitest';
import { type Customer } from '@trinserhof/types';
import { findNameSplitSuggestions } from './findNameSplitSuggestions';

let idCounter = 0;
const customer = (overrides: Partial<Customer>): Customer => ({
  id: `c${(idCounter += 1)}`,
  created: '2024-01-01',
  name: 'Jane',
  ...overrides,
});

describe('findNameSplitSuggestions', () => {
  it('returns nothing for an empty list', () => {
    expect(findNameSplitSuggestions([])).toEqual([]);
  });

  it('suggests splitting a two-word name into name + surname', () => {
    const suggestions = findNameSplitSuggestions([customer({ id: 'a', name: 'Elke Wimmer' })]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      id: 'a',
      suggestedName: 'Elke',
      suggestedSurname: 'Wimmer',
    });
  });

  it('keeps all but the last word as the name for multi-word names', () => {
    const suggestions = findNameSplitSuggestions([customer({ id: 'a', name: 'Maria Anna Huber' })]);

    expect(suggestions[0]).toMatchObject({
      suggestedName: 'Maria Anna',
      suggestedSurname: 'Huber',
    });
  });

  it('collapses extra whitespace before splitting', () => {
    const suggestions = findNameSplitSuggestions([customer({ id: 'a', name: '  Elke   Wimmer ' })]);

    expect(suggestions[0]).toMatchObject({ suggestedName: 'Elke', suggestedSurname: 'Wimmer' });
  });

  it('ignores records that already have a surname', () => {
    expect(
      findNameSplitSuggestions([customer({ id: 'a', name: 'Elke', surname: 'Wimmer' })]),
    ).toEqual([]);
  });

  it('treats a whitespace-only surname as no surname', () => {
    const suggestions = findNameSplitSuggestions([
      customer({ id: 'a', name: 'Elke Wimmer', surname: '   ' }),
    ]);

    expect(suggestions).toHaveLength(1);
  });

  it('ignores single-word names with nothing to split', () => {
    expect(findNameSplitSuggestions([customer({ id: 'a', name: 'asi' })])).toEqual([]);
    expect(findNameSplitSuggestions([customer({ id: 'a', name: '  Jane ' })])).toEqual([]);
  });
});
