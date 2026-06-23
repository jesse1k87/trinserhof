import { describe, expect, it } from 'vitest';
import { Booking, Room, ROOMS } from '@trinserhof/types';
import { seedRooms } from './seedRooms';

// Build minimal booking-shaped objects (the function reads OldBooking fields
// too) and cast rather than spelling out every required Booking field.
const booking = (b: Record<string, unknown>) => b as unknown as Booking;

describe('seedRooms', () => {
  it('returns every room as changed when none exist yet', () => {
    const result = seedRooms({});
    expect(result.summary.totalRooms).toBe(ROOMS.length);
    expect(result.summary.changedCount).toBe(ROOMS.length);
    for (const room of ROOMS) {
      expect(result.changedRooms[room.id]).toEqual(room);
    }
  });

  it('skips rooms that already match the source data', () => {
    const existing: Record<string, Room> = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
    const result = seedRooms(existing);
    expect(result.summary.changedCount).toBe(0);
    expect(Object.keys(result.changedRooms)).toHaveLength(0);
  });

  it('re-writes a room whose data drifted', () => {
    const existing: Record<string, Room> = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
    existing['101'] = { ...existing['101'], label: 'Stale label' };
    const result = seedRooms(existing);
    expect(result.summary.changedCount).toBe(1);
    expect(result.changedRooms['101']).toEqual(ROOMS.find((r) => r.id === '101'));
  });

  it('links each booking to its room via a rooms reference', () => {
    const result = seedRooms(
      {},
      {
        b1: booking({ id: 'b1', roomId: '114' }),
        b2: booking({ id: 'b2', roomId: '106' }),
      },
    );
    expect(result.summary.bookingsLinked).toBe(2);
    expect(result.bookingRoomUpdates.b1).toEqual(['114']);
    expect(result.bookingRoomUpdates.b2).toEqual(['106']);
  });

  it('falls back to the legacy group field and defaults unknown rooms to unassigned', () => {
    const result = seedRooms(
      {},
      {
        legacy: booking({ id: 'legacy', group: 114 }),
        unknown: booking({ id: 'unknown', roomId: '999' }),
        missing: booking({ id: 'missing' }),
      },
    );
    expect(result.bookingRoomUpdates.legacy).toEqual(['114']);
    expect(result.bookingRoomUpdates.unknown).toEqual(['0']);
    expect(result.bookingRoomUpdates.missing).toEqual(['0']);
  });

  it('skips bookings that are already linked to a room', () => {
    const result = seedRooms(
      {},
      {
        linked: booking({ id: 'linked', roomId: '101', rooms: ['101'] }),
        fresh: booking({ id: 'fresh', roomId: '102' }),
      },
    );
    expect(result.summary.bookingsLinked).toBe(1);
    expect(result.bookingRoomUpdates).not.toHaveProperty('linked');
    expect(result.bookingRoomUpdates.fresh).toEqual(['102']);
  });
});
