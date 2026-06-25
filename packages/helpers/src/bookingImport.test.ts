import { describe, expect, it } from 'vitest';
import {
  extractSourceBookings,
  mapSourceToBooking,
  prepareBookingsForImport,
  toBool,
  toChannel,
  toDateString,
  toNum,
  toStatus,
  toStr,
  toStringArray,
} from './bookingImport';

describe('value converters', () => {
  it('toStr trims and falls back for null/undefined', () => {
    expect(toStr('  hi  ')).toBe('hi');
    expect(toStr(42)).toBe('42');
    expect(toStr(undefined)).toBe('');
    expect(toStr(null, 'x')).toBe('x');
  });

  it('toNum parses numeric strings and falls back otherwise', () => {
    expect(toNum('60.00')).toBe(60);
    expect(toNum(7)).toBe(7);
    expect(toNum('')).toBe(0);
    expect(toNum('abc', -1)).toBe(-1);
    expect(toNum(undefined)).toBe(0);
  });

  it('toBool understands common truthy/falsy spellings', () => {
    expect(toBool(true)).toBe(true);
    expect(toBool('true')).toBe(true);
    expect(toBool('1')).toBe(true);
    expect(toBool('yes')).toBe(true);
    expect(toBool('no')).toBe(false);
    expect(toBool('0')).toBe(false);
    expect(toBool(undefined)).toBe(false);
  });

  it('toDateString keeps the date part of ISO strings without timezone shifts', () => {
    expect(toDateString('2024-08-09')).toBe('2024-08-09');
    expect(toDateString('2017-06-18 13:23:53')).toBe('2017-06-18');
    expect(toDateString('')).toBe('');
    expect(toDateString(undefined)).toBe('');
  });

  it('toStatus normalises case, aliases, and unknown values', () => {
    expect(toStatus('confirmed')).toBe('CONFIRMED');
    expect(toStatus('CONFIRMED')).toBe('CONFIRMED');
    expect(toStatus('maybe')).toBe('PENDING');
    expect(toStatus('canceled')).toBe('CANCELLED');
    expect(toStatus('something-else')).toBe('NO_STATUS');
    expect(toStatus(undefined)).toBe('NO_STATUS');
  });

  it('toChannel normalises case, aliases, and unknown values', () => {
    expect(toChannel('airbnb')).toBe('AIRBNB');
    expect(toChannel('Booking.com')).toBe('BOOKING');
    expect(toChannel('website')).toBe('UNKNOWN');
    expect(toChannel(undefined)).toBe('UNKNOWN');
  });

  it('toStringArray keeps non-empty strings only', () => {
    expect(toStringArray(['a', '', 'b'])).toEqual(['a', 'b']);
    expect(toStringArray('a')).toEqual([]);
    expect(toStringArray(undefined)).toEqual([]);
  });
});

describe('extractSourceBookings', () => {
  const a = { id: 'a' };
  const b = { id: 'b' };

  it('reads a { bookings: { <id>: {...} } } export', () => {
    expect(extractSourceBookings({ bookings: { a, b } })).toEqual([a, b]);
  });

  it('reads a { bookings: [ {...} ] } export', () => {
    expect(extractSourceBookings({ bookings: [a, b] })).toEqual([a, b]);
  });

  it('treats a root map as the booking collection', () => {
    expect(extractSourceBookings({ a, b })).toEqual([a, b]);
  });

  it('treats a root array as the booking collection', () => {
    expect(extractSourceBookings([a, b])).toEqual([a, b]);
  });

  it('returns [] for non-object input', () => {
    expect(extractSourceBookings(null)).toEqual([]);
    expect(extractSourceBookings('nope')).toEqual([]);
  });
});

describe('mapSourceToBooking', () => {
  it('maps a Firebase-style record and coerces field types', () => {
    const booking = mapSourceToBooking({
      id: 'abc',
      checkIn: '2024-08-09',
      checkOut: '2024-08-10',
      roomId: '120',
      status: 'CONFIRMED',
      channel: 'AIRBNB',
      adults: 2,
      children: 0,
      price: 140,
      name: 'Wolfgang Hornig',
    });

    expect(booking).toMatchObject({
      id: 'abc',
      checkIn: '2024-08-09',
      checkOut: '2024-08-10',
      roomId: '120',
      status: 'CONFIRMED',
      channel: 'AIRBNB',
      adults: 2,
      children: 0,
      babies: 0,
      pets: 0,
      price: 140,
      priceFixed: '',
      halbpension: false,
      email: '',
      name: 'Wolfgang Hornig',
      customers: [],
      deleted: false,
    });
  });

  it('mints an id when the source has none', () => {
    const booking = mapSourceToBooking({ checkIn: '2024-01-01', checkOut: '2024-01-02' });
    expect(booking.id).toBeTruthy();
    expect(typeof booking.id).toBe('string');
  });
});

describe('prepareBookingsForImport', () => {
  it('splits records into ready-to-import bookings and skipped ones', () => {
    const result = prepareBookingsForImport({
      bookings: {
        good: { checkIn: '2024-08-09', checkOut: '2024-08-10', roomId: '120', status: 'CONFIRMED' },
        noRoom: { id: 'noRoom', checkIn: '2024-08-09', checkOut: '2024-08-10' },
        noDates: { id: 'noDates', roomId: '120' },
      },
    });

    expect(result.total).toBe(3);
    expect(result.bookings).toHaveLength(1);
    expect(result.bookings[0].roomId).toBe('120');

    const skippedIds = result.invalid.map((entry) => entry.id);
    expect(skippedIds).toContain('noRoom');
    expect(skippedIds).toContain('noDates');
  });
});
