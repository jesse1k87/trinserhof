import { describe, expect, it } from 'vitest';
import { type Customer } from '@trinserhof/types';
import { getCustomerValidationErrors } from './getCustomerValidationErrors';

const validCustomer: Customer = { id: 'c1', name: 'Jane Doe', email: 'jane@example.com' };

describe('getCustomerValidationErrors', () => {
  it('returns no errors for a valid customer', () => {
    expect(getCustomerValidationErrors(validCustomer)).toEqual([]);
  });

  it('flags a missing email', () => {
    const errors = getCustomerValidationErrors({ ...validCustomer, email: '' });
    expect(errors).toContain('email is missing');
  });

  it('flags a missing name', () => {
    const errors = getCustomerValidationErrors({ ...validCustomer, name: '' });
    expect(errors).toContain('name is missing');
  });
});
