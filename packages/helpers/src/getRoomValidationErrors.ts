import { Room } from '@trinserhof/types';

// Mirrors the field requirements enforced by rooms/$roomId/.validate in database.rules.json,
// so a rejected write can be reported back with the specific field(s) that failed instead of just "PERMISSION_DENIED".
export const REQUIRED_ROOM_FIELD_TYPES: Record<string, 'string'> = {
  id: 'string',
  type: 'string',
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

  return errors;
};
