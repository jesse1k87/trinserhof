import { describe, expect, it } from 'vitest';
import { type Room } from '@trinserhof/types';
import { getRoomValidationErrors } from './getRoomValidationErrors';

const validRoom: Room = {
  id: '101',
  type: 'STANDARD_DOUBLE',
  label: 'Standard Room',
  description: 'Double room for 2 guests with bathroom.',
  pricePerNight: 135,
};

describe('getRoomValidationErrors', () => {
  it('returns no errors for a valid room with a flat price', () => {
    expect(getRoomValidationErrors(validRoom)).toEqual([]);
  });

  it('returns no errors for a valid room with tiered pricing', () => {
    const room: Room = { ...validRoom, pricePerNight: { 0: 135, 3: 115 } };
    expect(getRoomValidationErrors(room)).toEqual([]);
  });

  it('flags a missing label', () => {
    const errors = getRoomValidationErrors({ ...validRoom, label: '' });
    expect(errors).toContain('label is missing');
  });

  it('flags an empty tiered price map', () => {
    const errors = getRoomValidationErrors({ ...validRoom, pricePerNight: {} });
    expect(errors).toContain('pricePerNight must be a number or a map of nights to numbers');
  });

  it('flags a non-numeric tiered price', () => {
    const room = { ...validRoom, pricePerNight: { 0: 'free' } } as unknown as Room;
    const errors = getRoomValidationErrors(room);
    expect(errors).toContain('pricePerNight must be a number or a map of nights to numbers');
  });
});
