import { describe, expect, it } from 'vitest';
import { type Customer } from '@trinserhof/types';
import { resolveCustomerForEmail } from './resolveCustomerForEmail';

const existing: Customer = { id: 'c1', name: 'Jane Doe', email: 'Jane@Example.com', phone: '123' };

describe('resolveCustomerForEmail', () => {
  it('matches an existing customer case/whitespace-insensitively', () => {
    const result = resolveCustomerForEmail(' jane@example.com ', [existing]);
    expect(result).toBe(existing);
  });

  it('builds a fresh draft seeded from the fallback when no match exists', () => {
    const result = resolveCustomerForEmail('new@example.com', [existing], {
      name: 'New Guest',
      phone: '456',
    });
    expect(result.id).not.toBe(existing.id);
    expect(result.email).toBe('new@example.com');
    expect(result.name).toBe('New Guest');
    expect(result.phone).toBe('456');
  });

  it('omits empty fallback fields instead of writing blanks', () => {
    const result = resolveCustomerForEmail('new@example.com', []);
    expect(result.name).toBe('');
    expect(result.phone).toBeUndefined();
  });
});
