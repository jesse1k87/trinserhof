import { describe, expect, it } from 'vitest';
import { Booking } from '@trinserhof/types';
import { makeBookingBackwardsCompatible } from './makeBookingBackwardsCompatible';

// The function reads OldBooking fields too; build minimal booking-shaped
// objects and cast rather than spelling out every required Booking field.
const booking = (b: Record<string, unknown>) =>
  b as unknown as Parameters<typeof makeBookingBackwardsCompatible>[0];

describe('makeBookingBackwardsCompatible', () => {
  it('defaults halbpension to false when absent', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1' }));
    expect(result.halbpension).toBe(false);
  });

  it('defaults priceFixed to "0" when absent or empty string', () => {
    expect(makeBookingBackwardsCompatible(booking({ id: 'b1' })).priceFixed).toBe('0');
    expect(makeBookingBackwardsCompatible(booking({ id: 'b1', priceFixed: '' })).priceFixed).toBe(
      '0',
    );
  });

  it('stringifies a numeric priceFixed', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1', priceFixed: 135 }));
    expect(result.priceFixed).toBe('135');
  });

  it('passes through a free-text priceFixed override unchanged', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1', priceFixed: '135 pN' }));
    expect(result.priceFixed).toBe('135 pN');
  });

  it('extracts a valid channel id from a legacy channel object', () => {
    const result = makeBookingBackwardsCompatible(
      booking({ id: 'b1', channel: { id: 'AIRBNB', label: 'Airbnb' } }),
    );
    expect(result.channel).toBe('AIRBNB');
  });

  it('falls back to UNKNOWN for a legacy channel object with an invalid id', () => {
    const result = makeBookingBackwardsCompatible(
      booking({ id: 'b1', channel: { id: 'NOT_A_CHANNEL' } }),
    );
    expect(result.channel).toBe('UNKNOWN');
  });

  it('falls back to UNKNOWN when channel is absent', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1' }));
    expect(result.channel).toBe('UNKNOWN');
  });

  it('remaps a roomId of "119" stored directly to "120"', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1', roomId: '119' }));
    expect(result.roomId).toBe('120');
  });

  it('maps a numeric group onto roomId', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1', group: 114 }));
    expect(result.roomId).toBe('114');
  });

  it('falls back to defaultRoomId for a non-room group value', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1', group: 'Jesse' }));
    expect(result.roomId).toBe('0');
  });

  it('maps status "NO_STATUS" when status is entirely missing', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1' }));
    expect(result.status).toBe('NO_STATUS');
  });

  it('maps status "NO_STATUS" when status is an empty string', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1', status: '' }));
    expect(result.status).toBe('NO_STATUS');
  });

  it('maps legacy lowercase statuses onto the current Status enum', () => {
    expect(makeBookingBackwardsCompatible(booking({ id: 'b1', status: 'confirmed' })).status).toBe(
      'CONFIRMED',
    );
    expect(makeBookingBackwardsCompatible(booking({ id: 'b1', status: 'maybe' })).status).toBe(
      'PENDING',
    );
    expect(makeBookingBackwardsCompatible(booking({ id: 'b1', status: 'employee' })).status).toBe(
      'BLOCKED',
    );
  });

  it('maps deleted:true onto status CANCELLED when status is otherwise missing', () => {
    const result = makeBookingBackwardsCompatible(booking({ id: 'b1', deleted: true }));
    expect(result.status).toBe('CANCELLED');
  });

  it('leaves an already-current booking unchanged (idempotent)', () => {
    const current: Booking = {
      id: 'b1',
      email: 'a@example.com',
      name: 'Anna',
      checkIn: '2026-06-19',
      checkOut: '2026-06-21',
      status: 'CONFIRMED',
      roomId: '114',
      channel: 'AIRBNB',
      adults: 2,
      children: 0,
      babies: 0,
      pets: 0,
      price: 200,
      priceFixed: '200',
      halbpension: true,
      notes: 'note',
    };

    const result = makeBookingBackwardsCompatible(booking(current));
    expect(result).toEqual(current);
  });
});
