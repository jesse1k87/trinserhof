import { describe, expect, it } from 'vitest';
import { type Customer } from '@trinserhof/types';
import { mergeCustomerFields } from './mergeCustomerFields';

const base = (overrides: Partial<Customer>): Customer => ({
  id: 'primary',
  created: '2024-01-01',
  name: 'Jane',
  ...overrides,
});

describe('mergeCustomerFields', () => {
  it('keeps the primary id', () => {
    const merged = mergeCustomerFields(base({ id: 'primary' }), base({ id: 'secondary' }));
    expect(merged.id).toBe('primary');
  });

  it('fills a field that is empty on the primary from the secondary', () => {
    const primary = base({ phone: undefined, email: '' });
    const secondary = base({ phone: '+43 123', email: 'jane@example.com' });

    const merged = mergeCustomerFields(primary, secondary);

    expect(merged.phone).toBe('+43 123');
    expect(merged.email).toBe('jane@example.com');
  });

  it('keeps the primary value when both records have a value (primary wins conflicts)', () => {
    const primary = base({ phone: '111', city: 'Innsbruck' });
    const secondary = base({ phone: '222', city: 'Vienna' });

    const merged = mergeCustomerFields(primary, secondary);

    expect(merged.phone).toBe('111');
    expect(merged.city).toBe('Innsbruck');
  });

  it('keeps the primary value when the secondary field is empty', () => {
    const primary = base({ surname: 'Doe' });
    const secondary = base({ surname: '' });

    const merged = mergeCustomerFields(primary, secondary);

    expect(merged.surname).toBe('Doe');
  });

  it('keeps the earliest creation date', () => {
    const earlierPrimary = mergeCustomerFields(
      base({ created: '2024-01-01' }),
      base({ created: '2023-06-15' }),
    );
    expect(earlierPrimary.created).toBe('2023-06-15');

    const earlierSecondary = mergeCustomerFields(
      base({ created: '2022-03-10' }),
      base({ created: '2024-12-31' }),
    );
    expect(earlierSecondary.created).toBe('2022-03-10');
  });

  it('does not mutate the input records', () => {
    const primary = base({ phone: undefined });
    const secondary = base({ phone: '+43 999' });

    mergeCustomerFields(primary, secondary);

    expect(primary.phone).toBeUndefined();
    expect(secondary.phone).toBe('+43 999');
  });
});
