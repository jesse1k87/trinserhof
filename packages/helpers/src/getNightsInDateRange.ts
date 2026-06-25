import { getYYYYmmDD } from './getYYYYmmDD';

// Parses a 'YYYY-MM-DD' string into a local Date at midnight, sidestepping the
// UTC parsing of `new Date('YYYY-MM-DD')` (which can shift the day depending on
// the runtime timezone).
const parseLocalDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

// Returns one 'YYYY-MM-DD' string per night between check-in (inclusive) and
// check-out (exclusive) - i.e. the nights a guest is actually charged for. The
// check-out day itself is not a night. An invalid or non-positive range yields
// an empty array.
export const getNightsInDateRange = (checkIn: string, checkOut: string): string[] => {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  if (!start || !end) return [];

  const nights: string[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    nights.push(getYYYYmmDD(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
};
