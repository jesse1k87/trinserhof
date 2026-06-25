import { RestaurantTable } from '@trinserhof/types';

// Mirrors the field requirements enforced by tables/$tableId/.validate in database.rules.json,
// so a rejected write can be reported back with the specific field(s) that failed instead of just "PERMISSION_DENIED".
export const REQUIRED_TABLE_FIELD_TYPES: Record<string, 'string' | 'number'> = {
  id: 'string',
  name: 'string',
  areaName: 'string',
  maxGuests: 'number',
};

export const getTableValidationErrors = (table: RestaurantTable): string[] =>
  Object.entries(REQUIRED_TABLE_FIELD_TYPES).reduce<string[]>((errors, [field, type]) => {
    const value = (table as Record<string, unknown>)[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`${field} is missing`);
    } else if (typeof value !== type) {
      errors.push(`${field} must be a ${type} (got ${typeof value})`);
    }
    return errors;
  }, []);
