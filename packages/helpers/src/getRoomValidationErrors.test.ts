import { describe, expect, it } from 'vitest';
import { type Room } from '@trinserhof/types';
import { getRoomValidationErrors } from './getRoomValidationErrors';

const validRoom: Room = {
  id: '101',
  type: 'STANDARD',
  maxCustomers: 2,
};

describe('getRoomValidationErrors', () => {
  it('returns no errors for a valid room', () => {
    expect(getRoomValidationErrors(validRoom)).toEqual([]);
  });

  it('flags a missing label', () => {
    const errors = getRoomValidationErrors({ ...validRoom });
    expect(errors).toContain('label is missing');
  });
});
