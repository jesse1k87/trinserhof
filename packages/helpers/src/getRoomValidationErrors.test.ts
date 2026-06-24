import { describe, expect, it } from 'vitest';
import { type Room } from '@trinserhof/types';
import { getRoomValidationErrors } from './getRoomValidationErrors';

const validRoom: Room = {
  id: '101',
  type: 'STANDARD_DOUBLE',
  label: 'Standard Room',
  description: 'Double room for 2 guests with bathroom.',
};

describe('getRoomValidationErrors', () => {
  it('returns no errors for a valid room', () => {
    expect(getRoomValidationErrors(validRoom)).toEqual([]);
  });

  it('flags a missing label', () => {
    const errors = getRoomValidationErrors({ ...validRoom, label: '' });
    expect(errors).toContain('label is missing');
  });
});
