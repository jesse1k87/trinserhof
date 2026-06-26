import { describe, expect, it } from 'vitest';
import { type Customer } from '@trinserhof/types';
import { findDuplicateCustomers } from './findDuplicateCustomers';

let idCounter = 0;
const customer = (overrides: Partial<Customer>): Customer => ({
  id: `c${(idCounter += 1)}`,
  created: '2024-01-01',
  name: 'Jane',
  ...overrides,
});

describe('findDuplicateCustomers', () => {
  it('returns nothing for an empty or single-record list', () => {
    expect(findDuplicateCustomers([])).toEqual([]);
    expect(findDuplicateCustomers([customer({})])).toEqual([]);
  });

  it('flags records that share an email regardless of case and spacing', () => {
    const a = customer({ id: 'a', email: 'Jane@Example.com' });
    const b = customer({ id: 'b', email: '  jane@example.com ' });

    const suggestions = findDuplicateCustomers([a, b]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].customers.map((c) => c.id).sort()).toEqual(['a', 'b']);
    expect(suggestions[0].reasons).toEqual(['EMAIL']);
  });

  it('flags records that share a phone number despite formatting differences', () => {
    const a = customer({ id: 'a', name: 'Jane', phone: '+43 (123) 456-789' });
    const b = customer({ id: 'b', name: 'John', phone: '0043 123 456 789' });

    const suggestions = findDuplicateCustomers([a, b]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].reasons).toEqual(['PHONE']);
  });

  it('ignores very short phone numbers as a signal', () => {
    const a = customer({ id: 'a', name: 'Jane', phone: '123' });
    const b = customer({ id: 'b', name: 'John', phone: '123' });

    expect(findDuplicateCustomers([a, b])).toEqual([]);
  });

  it('flags matching full names but not a shared first name alone', () => {
    const sameFullName = findDuplicateCustomers([
      customer({ id: 'a', name: 'Jane', surname: 'Doe' }),
      customer({ id: 'b', name: 'jane', surname: 'doe' }),
    ]);
    expect(sameFullName).toHaveLength(1);
    expect(sameFullName[0].reasons).toEqual(['NAME']);

    const sharedFirstName = findDuplicateCustomers([
      customer({ id: 'a', name: 'Jane', surname: 'Doe' }),
      customer({ id: 'b', name: 'Jane', surname: 'Smith' }),
    ]);
    expect(sharedFirstName).toEqual([]);
  });

  it('collapses multiple signals into one suggestion, strongest reason first', () => {
    const a = customer({
      id: 'a',
      name: 'Jane',
      surname: 'Doe',
      email: 'j@x.com',
      phone: '+43123456',
    });
    const b = customer({
      id: 'b',
      name: 'Jane',
      surname: 'Doe',
      email: 'j@x.com',
      phone: '0043123456',
    });

    const suggestions = findDuplicateCustomers([a, b]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].reasons).toEqual(['EMAIL', 'PHONE', 'NAME']);
  });

  it('orders stronger matches (email) ahead of weaker ones (name only)', () => {
    const emailPair = [
      customer({ id: 'e1', name: 'Anna', surname: 'A', email: 'shared@x.com' }),
      customer({ id: 'e2', name: 'Bob', surname: 'B', email: 'shared@x.com' }),
    ];
    const namePair = [
      customer({ id: 'n1', name: 'Carl', surname: 'Klein' }),
      customer({ id: 'n2', name: 'Carl', surname: 'Klein' }),
    ];

    const suggestions = findDuplicateCustomers([...namePair, ...emailPair]);

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].reasons).toEqual(['EMAIL']);
    expect(suggestions[1].reasons).toEqual(['NAME']);
  });

  it('does not match a record against itself', () => {
    const only = customer({ id: 'a', email: 'jane@example.com', phone: '+43123456' });
    expect(findDuplicateCustomers([only])).toEqual([]);
  });
});
