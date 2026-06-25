import { Booking } from '@trinserhof/types';

// Mirrors the field requirements enforced by bookings/$bookingId/.validate in database.rules.json,
// so a rejected write can be reported back with the specific field(s) that failed instead of just "PERMISSION_DENIED".
export const REQUIRED_BOOKING_FIELD_TYPES: Record<string, 'string' | 'number' | 'boolean'> = {
  adults: 'number',
  babies: 'number',
  checkIn: 'string',
  checkOut: 'string',
  children: 'number',
  pets: 'number',
  roomId: 'string',
  status: 'string',
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
