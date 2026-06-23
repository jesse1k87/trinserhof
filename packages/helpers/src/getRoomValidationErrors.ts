import { Room } from '@trinserhof/types';

// Mirrors the field requirements enforced by rooms/$roomId/.validate in database.rules.json,
// so a rejected write can be reported back with the specific field(s) that failed instead of just "PERMISSION_DENIED".
export const REQUIRED_ROOM_FIELD_TYPES: Record<string, 'string'> = {
  id: 'string',
  type: 'string',
  label: 'string',
  description: 'string',
};

const isValidPricePerNight = (pricePerNight: Room['pricePerNight']) => {
  if (typeof pricePerNight === 'number') return !isNaN(pricePerNight);
  if (!pricePerNight || typeof pricePerNight !== 'object') return false;
  const prices = Object.values(pricePerNight);
  return prices.length > 0 && prices.every((price) => typeof price === 'number' && !isNaN(price));
};

export const getRoomValidationErrors = (room: Room): string[] => {
  const errors = Object.entries(REQUIRED_ROOM_FIELD_TYPES).reduce<string[]>(
    (errors, [field, type]) => {
      const value = (room as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is missing`);
      } else if (typeof value !== type) {
        errors.push(`${field} must be a ${type} (got ${typeof value})`);
      }
      return errors;
    },
    [],
  );

  if (!isValidPricePerNight(room.pricePerNight)) {
    errors.push('pricePerNight must be a number or a map of nights to numbers');
  }

  return errors;
};
