import { RoomType } from '@trinserhof/types';

export const REQUIRED_ROOM_TYPE_FIELD_TYPES: Record<string, 'string'> = {
  id: 'string',
  label: 'string',
};

export const getRoomTypeValidationErrors = (roomType: RoomType): string[] => {
  const errors = Object.entries(REQUIRED_ROOM_TYPE_FIELD_TYPES).reduce<string[]>(
    (errors, [field, type]) => {
      const value = (roomType as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is missing`);
      } else if (typeof value !== type) {
        errors.push(`${field} must be a ${type} (got ${typeof value})`);
      }
      return errors;
    },
    [],
  );

  if (roomType.description !== undefined && typeof roomType.description !== 'string') {
    errors.push('description must be a string');
  }

  return errors;
};
