import { Property } from '@trinserhof/types';

// Name and legal name are the only strictly required fields; everything else is
// allowed to be empty for now (a property can be filled in over time).
export const REQUIRED_PROPERTY_FIELD_TYPES: Record<string, 'string'> = {
  name: 'string',
  legalName: 'string',
};

export const getPropertyValidationErrors = (property: Property): string[] => {
  const errors = Object.entries(REQUIRED_PROPERTY_FIELD_TYPES).reduce<string[]>(
    (errors, [field, type]) => {
      const value = (property as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is missing`);
      } else if (typeof value !== type) {
        errors.push(`${field} must be a ${type} (got ${typeof value})`);
      }
      return errors;
    },
    [],
  );

  if (
    typeof property.cityTaxPerPersonPerNight !== 'number' ||
    Number.isNaN(property.cityTaxPerPersonPerNight)
  ) {
    errors.push('cityTaxPerPersonPerNight must be a number');
  } else if (property.cityTaxPerPersonPerNight < 0) {
    errors.push('cityTaxPerPersonPerNight must not be negative');
  }

  return errors;
};
