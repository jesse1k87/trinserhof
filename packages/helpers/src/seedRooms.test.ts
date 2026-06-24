import { describe, expect, it } from 'vitest';
import { Room, ROOMS } from '@trinserhof/types';
import { seedRooms } from './seedRooms';

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
});
