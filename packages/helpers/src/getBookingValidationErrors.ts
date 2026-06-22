import { Booking } from '@trinserhof/types';

// Mirrors the field requirements enforced by bookings/$bookingId/.validate in database.rules.json,
// so a rejected write can be reported back with the specific field(s) that failed instead of just "PERMISSION_DENIED".
export const REQUIRED_BOOKING_FIELD_TYPES: Record<string, 'string' | 'number' | 'boolean'> = {
  email: 'string',
  checkIn: 'string',
  checkOut: 'string',
  status: 'string',
  roomId: 'string',
  channel: 'string',
  adults: 'number',
  children: 'number',
  babies: 'number',
  pets: 'number',
  price: 'number',
  priceFixed: 'string',
  halbpension: 'boolean',
};

export const getBookingValidationErrors = (booking: Booking): string[] =>
  Object.entries(REQUIRED_BOOKING_FIELD_TYPES).reduce<string[]>((errors, [field, type]) => {
    const value = (booking as Record<string, unknown>)[field];
    if (value === undefined || value === null) {
      errors.push(`${field} is missing`);
    } else if (typeof value !== type) {
      errors.push(`${field} must be a ${type} (got ${typeof value})`);
    }
    return errors;
  }, []);
